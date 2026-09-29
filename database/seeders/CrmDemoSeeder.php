<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Branch;
use App\Models\CrmActivity;
use App\Models\Lead;
use App\Models\Organization;
use App\Models\Specialist;
use App\Models\Treatment;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Demo CRM so the admin is never empty: leads from the last month across
 * every source and stage, and appointments yesterday, today and this week.
 * Fictional people only (plan.md 69).
 */
class CrmDemoSeeder extends Seeder
{
    private const PEOPLE = [
        ['Andrea', 'Reyes'], ['Bianca', 'Santos'], ['Carmela', 'Cruz'], ['Danica', 'Bautista'], ['Erika', 'Ocampo'],
        ['Frances', 'Garcia'], ['Gabrielle', 'Mendoza'], ['Hannah', 'Torres'], ['Isabelle', 'Tan'], ['Jasmine', 'Lim'],
        ['Katrina', 'Aquino'], ['Lianne', 'Ramos'], ['Maxine', 'Castillo'], ['Nicole', 'Flores'], ['Patricia', 'Villanueva'],
        ['Rafael', 'Navarro'], ['Samantha', 'Chua'], ['Trisha', 'Dela Cruz'], ['Victoria', 'Gonzales'], ['Ysabel', 'Salazar'],
        ['Miguel', 'Soriano'], ['Clarisse', 'Uy'], ['Denise', 'Pascual'], ['Kimberly', 'Go'], ['Louise', 'Manalo'],
        ['Monica', 'Yap'], ['Paolo', 'De Leon'], ['Regina', 'Lopez'], ['Sofia', 'Rivera'], ['Therese', 'Ong'],
        ['Alyssa', 'Mercado'], ['Bea', 'Sy'], ['Czarina', 'Javier'], ['Dianne', 'Co'], ['Elaine', 'Padilla'],
        ['Jericho', 'Valdez'], ['Kaye', 'Morales'], ['Mariel', 'Tiu'], ['Nina', 'Robles'], ['Pia', 'Evangelista'],
    ];

    /** [source, utm_source, utm_medium, utm_campaign] */
    private const SOURCES = [
        ['website', null, null, null], ['google', 'google', 'cpc', 'search-hydrafacial'], ['facebook', 'facebook', 'social', 'glow-september'],
        ['instagram', 'instagram', 'social', 'glass-skin-reels'], ['tiktok', 'tiktok', 'social', 'laser-myths'], ['referral', null, null, null],
        ['walk_in', null, null, null], ['phone', null, null, null], ['google', 'google', 'organic', null],
    ];

    private const MESSAGES = [
        'Hi, how many sessions would I need for the melasma package?',
        'Is there a promo for first timers this month?',
        'Can I bring a friend for a consultation at the same time?',
        'I have sensitive skin. Is the Hydra Facial okay for me?',
        'What is the downtime after a laser session? I have an event next week.',
        null, null,
    ];

    public function run(): void
    {
        mt_srand(28);

        $organization = Organization::where('slug', config('clinic.organization'))->firstOrFail();
        $org = ['organization_id' => $organization->id];
        $branches = Branch::withoutGlobalScopes()->where($org)->orderBy('id')->with('specialists')->get();
        $treatments = Treatment::withoutGlobalScopes()->where($org)->where('is_active', true)->get();
        $stages = array_keys(Lead::STAGES);
        $taken = [];
        $today = CarbonImmutable::today();

        foreach (self::PEOPLE as $i => [$first, $last]) {
            [$source, $utmSource, $utmMedium, $campaign] = self::SOURCES[$i % count(self::SOURCES)];
            $branch = $branches[$i % $branches->count()];
            $treatment = $treatments[mt_rand(0, $treatments->count() - 1)];
            // The first eight are this week's fresh enquiries; older ones moved down the pipeline.
            $created = $i < 8 ? $today->subDays(intdiv($i, 2)) : $today->subDays(mt_rand(4, 30));
            $created = $created->setTime(mt_rand(8, 21), mt_rand(0, 59));
            if ($created->isFuture()) {
                $created = CarbonImmutable::now()->subMinutes(25 + $i * 40);
            }
            $stage = $i < 8 ? 'new' : $stages[min(count($stages) - 1, intdiv($i - 8, 4) + 1)];

            $lead = Lead::withoutGlobalScopes()->create($org + [
                'first_name' => $first,
                'last_name' => $last,
                'email' => Str::lower(Str::slug($first.' '.$last, '.')).'@example.com',
                'phone' => sprintf('09%02d %03d %04d', mt_rand(15, 99), mt_rand(100, 999), mt_rand(1000, 9999)),
                'source' => $source,
                'stage' => $stage,
                'form' => $i % 3 === 0 ? 'booking' : 'enquiry',
                'treatment_id' => $treatment->id,
                'branch_id' => $branch->id,
                'message' => self::MESSAGES[$i % count(self::MESSAGES)],
                'utm_source' => $utmSource,
                'utm_medium' => $utmMedium,
                'utm_campaign' => $campaign,
                'device' => $i % 3 === 1 ? 'desktop' : 'mobile',
                'privacy_consent_at' => $created,
                'marketing_consent' => $i % 2 === 0,
                'created_at' => $created,
                'updated_at' => $created,
            ]);

            $this->activity($org, $lead->id, $lead->form, 'Website '.$lead->form.' form submitted', $created);

            $specialist = $branch->specialists->isEmpty() ? null : $branch->specialists[$i % $branch->specialists->count()];
            if ($stage === 'new' || ! $specialist instanceof Specialist) {
                continue;
            }

            // Everyone past "new" has an appointment: some done, several today, some ahead.
            $offset = [0, -2, 0, 1, -1, 0, 2, 0, 3, 0][$i % 10];

            // Carbon is mutable: addDays() on the base instance walks the base
            // date forward with every appointment, so each one is counted off a
            // copy or the whole schedule drifts a day at a time.
            $day = $today->copy()->addDays($offset);

            // The database refuses two appointments for one specialist in the
            // same minute, and the seeded hours repeat every eight leads. Widen
            // the slot until it is genuinely free, asking the database rather
            // than only the local map -- an in-memory guard alone let a
            // collision through and aborted the seed partway on a duplicate
            // key, leaving a demonstration half loaded.
            for ($slot = 0; $slot < 40; $slot++) {
                $start = $day->copy()->setTime(9 + ($slot % 10), intdiv($slot, 10) * 15);

                if (! isset($taken[$specialist->id.'|'.$start->toDateTimeString()])
                    && ! Appointment::withoutGlobalScopes()
                        ->where('specialist_id', $specialist->id)
                        ->where('starts_at', $start)
                        ->exists()) {
                    break;
                }
            }

            $taken[$specialist->id.'|'.$start->toDateTimeString()] = true;

            $status = match (true) {
                $offset < 0 => $i % 5 === 0 ? 'no_show' : 'completed',
                $offset === 0 => ['confirmed', 'checked_in', 'pending', 'in_treatment', 'completed'][$i % 5],
                default => $i % 2 ? 'confirmed' : 'pending',
            };

            $appointment = Appointment::withoutGlobalScopes()->create($org + [
                'reference' => 'PT-'.Str::upper(Str::random(6)),
                'lead_id' => $lead->id,
                'branch_id' => $branch->id,
                'treatment_id' => $treatment->id,
                'specialist_id' => $specialist->id,
                'starts_at' => $start,
                'ends_at' => $start->addMinutes($treatment->duration_minutes),
                'status' => $status,
            ]);

            $this->activity($org, $lead->id, 'booking', sprintf('Booked %s at %s for %s (%s)', $treatment->name, $branch->name, $start->format('D j M, g:i A'), $appointment->reference), $created->addHour());
        }
    }

    /** @param array{organization_id: int} $org */
    private function activity(array $org, int $leadId, string $type, string $description, CarbonImmutable $at): void
    {
        CrmActivity::withoutGlobalScopes()->create($org + [
            'lead_id' => $leadId, 'type' => $type, 'description' => $description, 'created_at' => $at, 'updated_at' => $at,
        ]);
    }
}
