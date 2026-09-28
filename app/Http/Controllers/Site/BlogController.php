<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

/** The clinic journal (plan.md §2): general guidance, never a medical claim. */
class BlogController extends Controller
{
    /** @return array<string, mixed> */
    public static function row(Post $post): array
    {
        return [
            'id' => $post->id,
            'title' => $post->title,
            'slug' => $post->slug,
            'category' => $post->category,
            'excerpt' => $post->excerpt,
            'image' => $post->image,
            'author_name' => $post->author_name,
            'read_minutes' => $post->read_minutes,
            'published_at' => $post->published_at?->toIso8601String(),
        ];
    }

    public function index(Request $request): Response
    {
        $filters = $request->validate(['category' => ['nullable', 'string', 'max:40']]);

        $posts = Post::where('is_published', true)
            ->when($filters['category'] ?? null, fn (Builder $q, string $category) => $q->where('category', $category))
            ->latest('published_at')
            ->paginate(6)
            ->withQueryString()
            ->through(self::row(...));

        return Inertia::render('blog/index', [
            'posts' => $posts,
            'filter' => $filters['category'] ?? null,
            'categories' => Post::where('is_published', true)->selectRaw('category, count(*) as total')->groupBy('category')->orderBy('category')->pluck('total', 'category'),
        ]);
    }

    public function show(string $slug): Response
    {
        $post = Post::where('slug', $slug)->where('is_published', true)->firstOrFail();

        return Inertia::render('blog/show', [
            'post' => self::row($post) + ['paragraphs' => $post->paragraphs(), 'takeaways' => $post->takeaways ?? []],
            'related' => $this->related($post),
        ]);
    }

    /** @return Collection<int, array<string, mixed>> */
    private function related(Post $post): Collection
    {
        $sameCategory = Post::where('is_published', true)
            ->where('id', '!=', $post->id)
            ->where('category', $post->category)
            ->latest('published_at')
            ->limit(3)
            ->get();

        return ($sameCategory->count() < 3
            ? $sameCategory->concat(Post::where('is_published', true)->where('id', '!=', $post->id)->whereNotIn('id', $sameCategory->pluck('id'))->latest('published_at')->limit(3 - $sameCategory->count())->get())
            : $sameCategory)->map(self::row(...))->values();
    }
}
