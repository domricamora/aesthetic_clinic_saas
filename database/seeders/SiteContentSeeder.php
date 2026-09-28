<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Faq;
use App\Models\Organization;
use App\Models\Specialist;
use App\Models\Testimonial;
use App\Models\Treatment;
use App\Models\TreatmentCategory;
use Illuminate\Database\Seeder;

/**
 * Fictional demo content for the public site (plan.md §9, §69, §83).
 * Copy avoids result guarantees and superiority claims on purpose.
 */
class SiteContentSeeder extends Seeder
{
    public const CATEGORIES = [
        'facial' => ['Facial Treatments', 'Cleansing, resurfacing and renewal for every skin type, planned around your concerns.', 'facial.jpg'],
        'injectables' => ['Injectables', 'Doctor-performed treatments for lines, volume and hydration, always after a consultation.', 'botox.jpg'],
        'body' => ['Body', 'Non-surgical contouring and skin firming for the areas you want to address.', 'body.jpg'],
        'hair' => ['Hair and Scalp', 'Scalp health and hair support programs led by our physicians.', 'prp.jpg'],
        'wellness' => ['Wellness', 'Consultations and infusions that support how you feel day to day.', 'iv.jpg'],
        'makeup' => ['Makeup and Beauty', 'Event, bridal and everyday looks by our in-house makeup artists.', 'makeup.jpg'],
    ];

    /** slug => [category, name, summary, minutes, price, promo, image, sessions, featured] */
    public const TREATMENTS = [
        'hydra-facial' => ['facial', 'Hydra Facial', 'Deep cleansing, gentle exfoliation and serum infusion in one visit.', 60, 3500, 2990, 'hydrafacial.jpg', '1 session monthly', true],
        'chemical-peel' => ['facial', 'Chemical Peel', 'Controlled exfoliation to refresh tone and texture.', 45, 2800, null, 'peel.jpg', '3 to 6 sessions', false],
        'acne-treatment' => ['facial', 'Acne Treatment', 'A doctor-guided plan combining extraction, peels and home care.', 60, 2500, null, 'facial.jpg', '4 to 8 sessions', true],
        'skin-rejuvenation' => ['facial', 'Skin Rejuvenation', 'Laser and light treatment for dullness, uneven tone and fine texture.', 60, 6500, null, 'acne.jpg', '3 sessions', false],
        'carbon-laser-facial' => ['facial', 'Carbon Laser Facial', 'A carbon mask and laser pass for oily, congested skin.', 45, 3800, 3200, 'laser.jpg', '4 sessions', false],
        'botox' => ['injectables', 'Botulinum Toxin', 'Softens expression lines on the forehead, frown and crow feet.', 30, 12000, null, 'botox.jpg', 'Every 4 to 6 months', true],
        'dermal-fillers' => ['injectables', 'Dermal Fillers', 'Hyaluronic acid to restore volume to lips, cheeks and chin.', 45, 18000, null, 'fillers.jpg', 'Per consultation', false],
        'skin-boosters' => ['injectables', 'Skin Boosters', 'Micro-injections of hyaluronic acid for hydration and glow.', 45, 8500, null, 'booster.jpg', '3 sessions, 4 weeks apart', true],
        'body-contouring' => ['body', 'Body Contouring', 'Non-invasive treatment for stubborn areas of the abdomen and thighs.', 60, 9500, null, 'body.jpg', '4 to 6 sessions', true],
        'rf-body-treatment' => ['body', 'RF Body Treatment', 'Radiofrequency heating to support firmer-looking skin.', 45, 4500, null, 'rf-body.jpg', '6 sessions', false],
        'fat-reduction' => ['body', 'Fat Reduction', 'Cooling technology that targets fat cells in selected areas.', 75, 15000, null, 'technology.jpg', 'Per area, 1 to 3 sessions', false],
        'cellulite-treatment' => ['body', 'Cellulite Treatment', 'Massage, suction and heat to smooth the look of dimpling.', 45, 5500, null, 'rf-body.jpg', '6 to 8 sessions', false],
        'hair-restoration' => ['hair', 'Hair Restoration', 'A physician plan for thinning hair, from diagnosis to follow-up.', 60, 8000, null, 'prp.jpg', 'Per plan', false],
        'scalp-treatment' => ['hair', 'Scalp Treatment', 'Deep scalp cleansing and care for build-up and irritation.', 45, 2200, null, 'hair.jpg', 'Monthly', false],
        'prp' => ['hair', 'PRP Therapy', 'Your own platelet-rich plasma, applied to the scalp or skin.', 60, 7500, null, 'prp.jpg', '3 to 4 sessions', false],
        'iv-therapy' => ['wellness', 'IV Therapy', 'Vitamin and hydration drips given under medical supervision.', 45, 3200, null, 'iv.jpg', 'As advised', true],
        'wellness-consultation' => ['wellness', 'Wellness Consultation', 'A doctor review of your goals, lifestyle and history.', 30, 1500, null, 'wellness.jpg', 'Once, then as needed', false],
        'vitamin-treatments' => ['wellness', 'Vitamin Treatments', 'Targeted vitamin shots chosen with your doctor.', 20, 1800, null, 'membership.jpg', 'As advised', false],
        'event-makeup' => ['makeup', 'Event Makeup', 'A polished look for celebrations, shoots and special occasions.', 90, 3500, null, 'makeup-2.jpg', 'Per event', true],
        'bridal-makeup' => ['makeup', 'Bridal Makeup', 'Trial session and wedding-day makeup that lasts from ceremony to reception.', 150, 12000, null, 'bridal.jpg', 'Trial plus wedding day', false],
        'makeup-lesson' => ['makeup', 'Personal Makeup Lesson', 'Learn an everyday routine for your features with products you already own.', 90, 4500, 3900, 'makeup.jpg', 'One session', false],
    ];

    public function run(): void
    {
        $organization = Organization::where('slug', config('clinic.organization'))->firstOrFail();
        $org = ['organization_id' => $organization->id];

        $hours = ['Mon to Fri' => '10:00 to 20:00', 'Saturday' => '10:00 to 18:00', 'Sunday' => 'Closed'];
        foreach (['makati' => 'makati.jpg', 'bgc' => 'bgc.jpg', 'cebu' => 'cebu.jpg'] as $slug => $image) {
            Branch::withoutGlobalScopes()->where($org + ['slug' => $slug])->first()?->update([
                'image' => "/media/photos/$image",
                'hours' => $slug === 'cebu' ? ['Mon to Sat' => '10:00 to 19:00', 'Sunday' => 'Closed'] : $hours,
            ]);
        }

        $categories = [];
        foreach (self::CATEGORIES as $slug => [$name, $description, $image]) {
            $categories[$slug] = TreatmentCategory::withoutGlobalScopes()->updateOrCreate($org + ['slug' => $slug], [
                'name' => $name, 'description' => $description, 'image' => "/media/photos/$image", 'sort' => count($categories),
            ]);
        }

        $sort = 0;
        foreach (self::TREATMENTS as $slug => [$category, $name, $summary, $minutes, $price, $promo, $image, $sessions, $featured]) {
            Treatment::withoutGlobalScopes()->updateOrCreate($org + ['slug' => $slug], [
                'treatment_category_id' => $categories[$category]->id,
                'name' => $name,
                'summary' => $summary,
                'description' => "$summary Every $name starts with a short assessment so your practitioner can confirm it suits your skin and goals, explain what to expect, and agree the plan with you before anything begins.",
                'duration_minutes' => $minutes,
                'price' => $price,
                'promo_price' => $promo,
                'image' => "/media/photos/$image",
                'preparation' => $category === 'makeup' ? 'Arrive with a clean, moisturized face and bring a photo of your outfit or inspiration look.' : 'Arrive with clean skin where possible. Tell us about medicines, allergies, recent treatments or pregnancy before your session.',
                'aftercare' => $category === 'makeup' ? 'Remove makeup gently at the end of the day with a cleansing balm, then moisturize.' : 'Use broad-spectrum sunscreen daily, keep the area clean, and follow the written aftercare your practitioner gives you.',
                'contraindications' => $category === 'makeup' ? null : 'Not suitable during pregnancy or breastfeeding, with active infection in the area, or with some medical conditions. Your doctor will review your history first.',
                'recommended_sessions' => $sessions,
                'is_featured' => $featured,
                'sort' => $sort++,
            ]);
        }

        $specialists = [
            ['dr-sofia-reyes', 'Dr. Sofia Reyes', 'Medical Director, Aesthetic Dermatology', 'MD, Diplomate in Dermatology', 'Sofia leads our treatment standards and trains every practitioner. She focuses on acne, pigmentation and conservative injectables, and prefers plans that build results slowly.', 'doctor-sofia.jpg', ['Acne and pigmentation', 'Injectables', 'Skin rejuvenation'], ['makati', 'bgc']],
            ['dr-adrian-santos', 'Dr. Adrian Santos', 'Aesthetic Physician', 'MD, Fellow in Aesthetic Medicine', 'Adrian works with body contouring and hair restoration. He spends the first visit on diagnosis and walks you through every option, including when not to treat.', 'doctor-adrian.jpg', ['Body contouring', 'Hair restoration', 'PRP'], ['bgc', 'cebu']],
            ['dr-maya-navarro', 'Dr. Maya Navarro', 'Wellness and Skin Physician', 'MD, Certified in Lifestyle Medicine', 'Maya combines skin care with wellness medicine. She runs our IV therapy program and sees patients who want a plan for both skin and energy.', 'doctor-maya.jpg', ['IV therapy', 'Wellness', 'Facial treatments'], ['makati', 'cebu']],
        ];
        $branches = Branch::withoutGlobalScopes()->where($org)->pluck('id', 'slug');
        foreach ($specialists as $i => [$slug, $name, $title, $credentials, $bio, $photo, $focus, $at]) {
            $specialist = Specialist::withoutGlobalScopes()->updateOrCreate($org + ['slug' => $slug], [
                'name' => $name, 'title' => $title, 'credentials' => $credentials, 'bio' => $bio,
                'photo' => "/media/photos/$photo", 'focus' => $focus, 'sort' => $i,
            ]);
            $specialist->branches()->sync($branches->only($at)->values());
        }

        $treatments = Treatment::withoutGlobalScopes()->where($org)->pluck('id', 'slug');
        Testimonial::withoutGlobalScopes()->where($org)->delete();
        foreach ([
            ['Camille R.', 'Makati, Hydra Facial', 'I came in for one facial and left with a plan I could actually follow. The team explained every step and never pushed me into extras.', 'hydra-facial'],
            ['Paolo D.', 'BGC, Hair Restoration', 'Dr. Adrian took time to find the cause before suggesting anything. Booking online and getting reminders made it easy to stay on schedule.', 'hair-restoration'],
            ['Andrea L.', 'Cebu, Skin Boosters', 'Calm clinic, clear pricing and a doctor who was honest about what to expect. I felt looked after from the first message.', 'skin-boosters'],
            ['Bea S.', 'Makati, Acne Treatment', 'The follow-ups were the difference for me. Someone checked in after each session and adjusted my home routine.', 'acne-treatment'],
        ] as [$author, $meta, $quote, $treatment]) {
            Testimonial::withoutGlobalScopes()->create($org + ['author_name' => $author, 'author_meta' => $meta, 'quote' => $quote, 'treatment_id' => $treatments[$treatment]]);
        }

        Faq::withoutGlobalScopes()->where($org)->delete();
        foreach ([
            ['Do I need a consultation before a treatment?', 'Yes for injectables, lasers, body and hair treatments. A doctor reviews your history and goals first. Facials can usually be booked directly, and we still check your skin on the day.'],
            ['Can I book without creating an account?', 'Yes. Choose a treatment, branch and time, leave your name and mobile number, and we confirm by SMS and email. You can create an account later to see your history.'],
            ['How do you handle my medical information?', 'Health information is sensitive personal information under the Data Privacy Act. Only authorized clinical staff can see it, every access is logged, and we never use clinical photos for marketing without your separate written consent.'],
            ['Which payment methods do you accept?', 'Cash, credit and debit cards, GCash, Maya and bank transfer. Some treatments ask for a small deposit to hold your slot.'],
            ['What if I need to reschedule?', 'Reschedule or cancel up to 24 hours before your appointment at no charge, online or by calling your branch.'],
            ['Are results guaranteed?', 'No clinic can honestly guarantee results. Your practitioner will explain what is realistic for you, how many sessions are usually needed, and the possible side effects before you decide.'],
        ] as $i => [$question, $answer]) {
            Faq::withoutGlobalScopes()->create($org + ['question' => $question, 'answer' => $answer, 'sort' => $i]);
        }
    }
}
