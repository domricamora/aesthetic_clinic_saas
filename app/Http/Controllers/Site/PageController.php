<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Faq;
use App\Models\Specialist;
use App\Models\Testimonial;
use App\Models\Treatment;
use App\Models\TreatmentCategory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    public function home(): Response
    {
        return Inertia::render('home', [
            'categories' => TreatmentCategory::orderBy('sort')->withCount(['treatments'])->get(['id', 'name', 'slug', 'description', 'image']),
            'featured' => $this->activeTreatments()->where('is_featured', true)->get(),
            'bookable' => $this->activeTreatments()->get(),
            'specialists' => $this->specialists(),
            'branches' => $this->branches(),
            'testimonials' => Testimonial::where('is_published', true)->latest('id')->get(['id', 'author_name', 'author_meta', 'quote', 'rating']),
            'faqs' => Faq::orderBy('sort')->get(['id', 'question', 'answer']),
        ]);
    }

    public function treatments(): Response
    {
        return Inertia::render('treatments/index', [
            'categories' => TreatmentCategory::orderBy('sort')->with(['treatments' => fn ($q) => $q->select(['id', 'treatment_category_id', 'name', 'slug', 'summary', 'duration_minutes', 'price', 'promo_price', 'image', 'recommended_sessions'])])->get(['id', 'name', 'slug', 'description', 'image']),
        ]);
    }

    public function treatment(string $slug): Response
    {
        $treatment = Treatment::where('slug', $slug)->where('is_active', true)->with('category:id,name,slug')->firstOrFail();

        return Inertia::render('treatments/show', [
            'treatment' => $treatment,
            'related' => Treatment::where('treatment_category_id', $treatment->treatment_category_id)->where('id', '!=', $treatment->id)->where('is_active', true)->orderBy('sort')->limit(3)->get(['id', 'name', 'slug', 'summary', 'price', 'promo_price', 'image', 'duration_minutes']),
            'specialists' => $this->specialists(),
        ]);
    }

    /** @return Builder<Treatment> */
    private function activeTreatments()
    {
        return Treatment::query()->where('is_active', true)->orderBy('sort')
            ->with('category:id,name,slug')
            ->select(['id', 'treatment_category_id', 'name', 'slug', 'summary', 'duration_minutes', 'price', 'promo_price', 'image', 'recommended_sessions', 'is_featured']);
    }

    /** @return Collection<int, array<string, mixed>> */
    private function specialists()
    {
        return Specialist::where('is_active', true)->orderBy('sort')->with('branches:id,name')->get()
            ->map(fn (Specialist $s) => $s->only(['id', 'name', 'slug', 'title', 'credentials', 'bio', 'photo', 'focus']) + ['branches' => $s->branches->pluck('name')]);
    }

    /** @return \Illuminate\Database\Eloquent\Collection<int, Branch> */
    private function branches()
    {
        return Branch::where('is_active', true)->orderBy('id')->get(['id', 'name', 'slug', 'address', 'city', 'phone', 'email', 'image', 'hours']);
    }
}
