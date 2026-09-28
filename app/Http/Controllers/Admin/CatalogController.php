<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Organization;
use App\Models\Product;
use App\Models\Treatment;
use App\Models\TreatmentCategory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The product catalogue (plan.md §19, §21). This is the same row the counter
 * sells from and the same row the shelves are counted against, so a price or a
 * name changed here is changed everywhere at once: the register picks it up on
 * its next load, and receipts already printed keep the price they were sold at.
 */
class CatalogController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:60'],
            'category' => ['nullable', 'string', 'max:60'],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'all'])],
            'tab' => ['nullable', Rule::in(['products', 'services'])],
        ]);

        $branchId = $request->integer('branch') ?: Branch::orderBy('id')->value('id');
        $branch = Branch::findOrFail($branchId);

        $products = Product::with('stocks')
            ->when($filters['q'] ?? null, fn (Builder $q, $term) => $q->where(fn (Builder $w) => $w
                ->where('name', 'like', "%{$term}%")
                ->orWhere('sku', 'like', "%{$term}%")))
            ->when($filters['category'] ?? null, fn (Builder $q, $c) => $q->where('category', $c))
            ->when(($filters['status'] ?? 'all') === 'active', fn (Builder $q) => $q->where('is_active', true))
            ->when(($filters['status'] ?? 'all') === 'inactive', fn (Builder $q) => $q->where('is_active', false))
            ->orderBy('category')
            ->orderBy('name')
            ->get()
            ->map(fn (Product $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'sku' => $p->sku,
                'category' => $p->category,
                'description' => $p->description,
                'price' => $p->price,
                'cost' => $p->cost,
                'is_active' => $p->is_active,
                'on_hand' => $p->onHandAt($branch),
                'margin' => $p->price > 0 ? round(($p->price - $p->cost) / $p->price * 100, 1) : null,
            ]);

        return Inertia::render('admin/catalog/index', [
            'tab' => $filters['tab'] ?? 'products',
            'products' => $products->values(),
            'services' => Treatment::withCount(['saleItems', 'appointments'])
                ->when($filters['q'] ?? null, fn (Builder $q, $term) => $q->where('name', 'like', "%{$term}%"))
                ->when(($filters['status'] ?? 'all') === 'active', fn (Builder $q) => $q->where('is_active', true))
                ->when(($filters['status'] ?? 'all') === 'inactive', fn (Builder $q) => $q->where('is_active', false))
                ->orderBy('sort')
                ->orderBy('name')
                ->get()
                ->map(fn (Treatment $t) => [
                    'id' => $t->id,
                    'name' => $t->name,
                    'summary' => $t->summary,
                    'description' => $t->description,
                    'price' => $t->price,
                    'promo_price' => $t->promo_price,
                    'duration_minutes' => (int) $t->duration_minutes,
                    'category_id' => $t->treatment_category_id,
                    'category' => $t->category?->name,
                    'is_active' => $t->is_active,
                    'sold' => $t->sale_items_count,
                    'booked' => $t->appointments_count,
                ]),
            'service_categories' => TreatmentCategory::orderBy('name')->get(['id', 'name']),
            'categories' => Product::orderBy('category')->distinct()->pluck('category')->filter()->values(),
            'query' => $filters['q'] ?? '',
            'category' => $filters['category'] ?? '',
            'status' => $filters['status'] ?? 'all',
            'branch' => ['id' => $branch->id, 'name' => $branch->name],
            'branches' => Branch::where('is_active', true)->orderBy('id')->get(['id', 'name']),
            'active' => $products->where('is_active', true)->count(),
            'out_of_stock' => $products->where('is_active', true)->where('on_hand', '<=', 0)->count(),
        ]);
    }

    /**
     * A service that has been sold or booked cannot be deleted: a receipt and a
     * booked client both have to keep naming it. Retiring it takes it off the
     * register and the website and leaves the history readable, so that is the
     * normal way to stop offering something. A real delete is only for a
     * service that was never used.
     */
    public function destroyService(Request $request, Treatment $treatment): RedirectResponse
    {
        $booked = $treatment->appointments()->count();
        $sold = $treatment->saleItems()->count();

        if ($booked > 0 || $sold > 0) {
            return back()->with(
                'error',
                sprintf(
                    '%s has %s and %s. Retire it instead so the history stays readable.',
                    $treatment->name,
                    $this->plural($sold, 'sale', 'sales'),
                    $this->plural($booked, 'booking', 'bookings'),
                ),
            );
        }

        $treatment->delete();

        return back()->with('success', $treatment->name.' deleted.');
    }

    /** Adds a service to the menu. */
    public function storeService(Request $request): RedirectResponse
    {
        $data = $this->validateService($request);

        Treatment::create($data + [
            'slug' => $this->uniqueSlug($data['name']),
            'is_active' => true,
        ]);

        return back()->with('success', $data['name'].' added to the menu.');
    }

    /** Edits a service, price and promo included. Receipts keep their own price. */
    public function updateService(Request $request, Treatment $treatment): RedirectResponse
    {
        $data = $this->validateService($request);
        $data['treatment_category_id'] ??= $treatment->treatment_category_id;

        $treatment->update($data);

        return back()->with('success', $treatment->name.' updated.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validateService(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'summary' => ['required', 'string', 'max:200'],
            'description' => ['required', 'string', 'max:5000'],
            'duration_minutes' => ['required', 'integer', 'min:5', 'max:600'],
            'price' => ['required', 'numeric', 'min:0', 'max:1000000'],
            'promo_price' => ['nullable', 'numeric', 'min:0', 'max:1000000'],
            // A service without a category has nowhere to sit on the menu.
            'treatment_category_id' => ['required', 'integer', Rule::exists('treatment_categories', 'id')],
            'recommended_sessions' => ['nullable', 'integer', 'min:1', 'max:60'],
            'preparation' => ['nullable', 'string', 'max:1000'],
            'aftercare' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['nullable', 'boolean'],
        ], [
            'price.required' => 'A price is what the counter will charge.',
            'summary.required' => 'The short line that sells it on the website.',
            'description.required' => 'A client reads this before they book.',
        ]);
    }

    private function plural(int $count, string $one, string $many): string
    {
        return $count.' '.($count === 1 ? $one : $many);
    }

    /** Adds an item to the catalogue. It holds no stock until it is received. */
    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateProduct($request);

        $product = Product::create($data + [
            'slug' => $this->uniqueSlug($data['name']),
            'is_active' => true,
        ]);

        return back()->with('success', $product->name.' added. Receive stock before selling it.');
    }

    /** Edits an item, including its price. Receipts already printed keep theirs. */
    public function update(Request $request, Product $product): RedirectResponse
    {
        $data = $this->validateProduct($request, $product);

        $product->update($data);

        return back()->with('success', $product->name.' updated.');
    }

    /**
     * @return array<string, mixed>
     */
    protected function validateProduct(Request $request, ?Product $product = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'sku' => [
                'nullable', 'string', 'max:40',
                Rule::unique('products', 'sku')
                    ->where(fn ($q) => $q->where('organization_id', $product?->organization_id ?? Organization::current()?->id))
                    ->ignore($product?->id),
            ],
            'category' => ['nullable', 'string', 'max:60'],
            'description' => ['nullable', 'string', 'max:1000'],
            'price' => ['required', 'numeric', 'min:0', 'max:1000000'],
            'cost' => ['required', 'numeric', 'min:0', 'max:1000000'],
            'is_active' => ['nullable', 'boolean'],
        ], [
            'price.required' => 'A price is what the counter will charge.',
            'cost.required' => 'A cost is what the shelves are valued at.',
        ]);
    }

    /** Names stay unique so links and receipts stay readable. */
    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'product';
        $slug = $base;
        $suffix = 2;

        while (Product::withoutGlobalScopes()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$suffix++;
        }

        return $slug;
    }
}
