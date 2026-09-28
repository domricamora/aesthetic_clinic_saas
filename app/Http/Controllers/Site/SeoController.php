<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Models\Post;
use App\Models\Treatment;
use Illuminate\Http\Response;

/** Sitemap and robots so search engines can find the public pages (plan.md §85). */
class SeoController extends Controller
{
    public function sitemap(): Response
    {
        $urls = collect([
            ['loc' => route('home'), 'priority' => '1.0'],
            ['loc' => route('treatments.index'), 'priority' => '0.9'],
            ['loc' => route('book'), 'priority' => '0.9'],
            ['loc' => route('about'), 'priority' => '0.7'],
            ['loc' => route('membership'), 'priority' => '0.7'],
            ['loc' => route('promotions'), 'priority' => '0.6'],
            ['loc' => route('before-after'), 'priority' => '0.6'],
            ['loc' => route('blog.index'), 'priority' => '0.7'],
            ['loc' => route('contact'), 'priority' => '0.7'],
        ])->concat(
            Treatment::where('is_active', true)->orderBy('sort')->get(['slug'])
                ->map(fn (Treatment $t) => ['loc' => route('treatments.show', $t->slug), 'priority' => '0.8'])
        )->concat(
            Post::where('is_published', true)->latest('published_at')->get(['slug', 'updated_at'])
                ->map(fn (Post $p) => ['loc' => route('blog.show', $p->slug), 'priority' => '0.5', 'lastmod' => $p->updated_at?->toDateString()])
        )->concat(
            Page::orderBy('id')->get(['slug'])->map(fn (Page $p) => ['loc' => route('legal', $p->slug), 'priority' => '0.3'])
        )->all();

        return response()
            ->view('sitemap', ['urls' => $urls])
            ->header('Content-Type', 'application/xml; charset=UTF-8');
    }

    public function robots(): Response
    {
        $lines = [
            'User-agent: *',
            'Allow: /',
            'Disallow: /admin',
            'Disallow: /dashboard',
            'Disallow: /settings',
            'Disallow: /book/confirmed',
            '',
            'Sitemap: '.route('sitemap'),
        ];

        return response(implode("\n", $lines)."\n")
            ->header('Content-Type', 'text/plain; charset=UTF-8');
    }
}
