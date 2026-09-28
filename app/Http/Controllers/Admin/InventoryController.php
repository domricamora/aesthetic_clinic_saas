<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Inventory\ManageStock;
use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\ProductStock;
use App\Models\Supplier;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The shelves behind the counter (plan.md §21, §22): what is held at each
 * branch, what is running out, what is about to expire, and every movement
 * that explains the numbers.
 */
class InventoryController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'branch' => ['nullable', 'integer'],
            'q' => ['nullable', 'string', 'max:60'],
            'category' => ['nullable', 'string', 'max:60'],
            'alert' => ['nullable', Rule::in(['expired', 'expiring', 'low', 'out'])],
        ]);

        $branch = isset($filters['branch'])
            ? Branch::findOrFail((int) $filters['branch'])
            : Branch::orderBy('id')->firstOrFail();

        $stocks = ProductStock::where('branch_id', $branch->id)->get()->keyBy('product_id');
        $batches = ProductBatch::where('branch_id', $branch->id)
            ->where('quantity', '>', 0)
            ->orderByRaw('expires_on is null')
            ->orderBy('expires_on')
            ->get()
            ->groupBy('product_id');

        $rows = Product::orderBy('name')
            ->when($filters['q'] ?? null, fn (Builder $q, $term) => $q->where('name', 'like', "%{$term}%"))
            ->when($filters['category'] ?? null, fn (Builder $q, $category) => $q->where('category', $category))
            ->get()
            ->map(fn (Product $product) => $this->row($product, $stocks, $batches));

        $alert = $filters['alert'] ?? null;

        if ($alert !== null) {
            $rows = $rows->filter(fn (array $row) => match ($alert) {
                'expired' => $row['expired_units'] > 0,
                'expiring' => $row['expiring_units'] > 0,
                'low' => $row['on_hand'] > 0 && $row['on_hand'] <= $row['reorder_level'],
                'out' => $row['on_hand'] <= 0,
            })->values();
        }

        return Inertia::render('admin/inventory/index', [
            'branch' => $branch->only(['id', 'name']),
            'branches' => Branch::where('is_active', true)->orderBy('id')->get(['id', 'name']),
            'categories' => Product::orderBy('category')->distinct()->pluck('category')->values(),
            'query' => $filters['q'] ?? '',
            'category' => $filters['category'] ?? '',
            'alert' => $alert,
            'rows' => $rows->values(),
            'alerts' => [
                'expired' => $rows->where('expired_units', '>', 0)->count(),
                'expiring' => $rows->where('expiring_units', '>', 0)->count(),
                'low' => ProductStock::where('branch_id', $branch->id)->where('on_hand', '>', 0)->whereColumn('on_hand', '<=', 'reorder_level')->count(),
                'out' => ProductStock::where('branch_id', $branch->id)->where('on_hand', '<=', 0)->count(),
            ],
            'total_value' => round($rows->sum('value'), 2),
            'movements' => self::movements(12),
            'movement_types' => InventoryMovement::TYPES,
        ]);
    }

    /**
     * One product as the branch holds it: the count, what it is worth at cost,
     * and which lots are expiring. plan.md §22 feeds the alerts from this.
     *
     * @param  Collection<int, ProductStock>  $stocks
     * @param  Collection<int, Collection<int, ProductBatch>>  $batches
     * @return array<string, mixed>
     */
    private function row(Product $product, $stocks, $batches): array
    {
        $stock = $stocks->get($product->id);
        $lots = $batches->get($product->id, collect());
        // A lot with no expiry is not expiring, and daysToExpiry is null for it.
        $dated = fn (ProductBatch $b) => $b->expires_on !== null && ! $b->isExpired();
        $expiring = $lots->filter(fn (ProductBatch $b) => $dated($b) && $b->daysToExpiry() <= 60);
        $expired = $lots->filter(fn (ProductBatch $b) => $b->isExpired());
        $next = $lots->first(fn (ProductBatch $b) => $dated($b) && $b->daysToExpiry() <= 60)
            // Expired-only stock still shows the date it went past.
            ?? $lots->first(fn (ProductBatch $b) => $b->expires_on !== null);

        return [
            'id' => $product->id,
            'name' => $product->name,
            'sku' => $product->sku,
            'category' => $product->category,
            'price' => (float) $product->price,
            'cost' => (float) $product->cost,
            'on_hand' => (int) ($stock?->on_hand ?? 0),
            'reorder_level' => (int) ($stock?->reorder_level ?? 0),
            'value' => round(((int) ($stock?->on_hand ?? 0)) * (float) $product->cost, 2),
            'lots' => $lots->count(),
            'expired_units' => (int) $expired->sum('quantity'),
            'expiring_units' => (int) $expiring->sum('quantity'),
            'next_expiry' => $next?->expires_on?->toDateString(),
            'next_expiry_days' => $next?->daysToExpiry(),
            'status' => $this->status($stock, $expired->isNotEmpty(), $expiring->isNotEmpty()),
        ];
    }

    private function status(?ProductStock $stock, bool $expired, bool $expiring): string
    {
        return match (true) {
            $expired => 'expired',
            (int) ($stock?->on_hand ?? 0) <= 0 => 'out',
            (int) ($stock?->on_hand ?? 0) <= (int) ($stock?->reorder_level ?? 0) => 'low',
            $expiring => 'expiring',
            default => 'ok',
        };
    }

    /**
     * The ledger, newest first.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public static function movements(int $limit, ?Builder $query = null): mixed
    {
        return ($query ?? InventoryMovement::query())
            ->with(['product:id,name,sku', 'user:id,name', 'batch:id,lot_number,expires_on'])
            ->latest('id')
            ->limit($limit)
            ->get()
            ->map(fn (InventoryMovement $m) => [
                'id' => $m->id,
                'product' => $m->product->name,
                'sku' => $m->product->sku,
                'type' => $m->type,
                'type_label' => InventoryMovement::TYPES[$m->type] ?? $m->type,
                'quantity' => $m->quantity,
                'cost' => (float) $m->cost,
                'lot' => $m->batch?->lot_number,
                'reference' => $m->reference,
                'note' => $m->note,
                'by' => $m->user?->name,
                'when' => $m->created_at->toIso8601String(),
            ]);
    }

    /** The lots of one product, soonest expiry first (FEFO order). */
    public function product(Request $request, Product $product): Response
    {
        $branchId = $request->integer('branch') ?: Branch::orderBy('id')->value('id');
        $branch = Branch::findOrFail($branchId);

        return Inertia::render('admin/inventory/product', [
            'product' => $product->only(['id', 'name', 'sku', 'category', 'price', 'cost', 'description', 'is_active']),
            'branch' => $branch->only(['id', 'name']),
            'branches' => Branch::where('is_active', true)->orderBy('id')->get(['id', 'name']),
            'on_hand' => $product->onHandAt($branch),
            'reorder_level' => (int) ($product->stockAt($branch)?->reorder_level ?? 0),
            'batches' => $product->batches()
                ->where('branch_id', $branch->id)
                ->with('supplier:id,name')
                ->fefo()
                ->get()
                ->map(fn (ProductBatch $b) => [
                    'id' => $b->id,
                    'lot_number' => $b->lot_number,
                    'expires_on' => $b->expires_on?->toDateString(),
                    'days_to_expiry' => $b->daysToExpiry(),
                    'received_on' => $b->received_on->toDateString(),
                    'quantity' => $b->quantity,
                    'cost' => (float) $b->cost,
                    'supplier' => $b->supplier?->name,
                    'note' => $b->note,
                    'expired' => $b->isExpired(),
                ]),
            'movements' => self::movements(40, InventoryMovement::where('product_id', $product->id)),
            'movement_types' => InventoryMovement::TYPES,
        ]);
    }

    /** A new lot arriving on the shelf. */
    public function createReceive(Request $request): Response
    {
        return Inertia::render('admin/inventory/receive', $this->formProps($request));
    }

    public function receive(Request $request, ManageStock $stock): RedirectResponse
    {
        $data = $this->validated($request);

        $stock->receive(
            Product::findOrFail($data['product_id']),
            Branch::findOrFail($data['branch_id']),
            $data,
            $request->user(),
        );

        return redirect()->to(route('admin.inventory.index', ['branch' => $data['branch_id']]))
            ->with('success', 'Stock received.');
    }

    /** A correction, damage, expiry, treatment use, or a transfer between branches. */
    public function createAdjust(Request $request): Response
    {
        return Inertia::render('admin/inventory/adjust', $this->formProps($request) + [
            'types' => ['adjustment' => 'Stocktake correction', 'damage' => 'Damaged', 'expired' => 'Expired', 'consume' => 'Used in a treatment', 'transfer' => 'Move to another branch'],
        ]);
    }

    public function adjust(Request $request, ManageStock $stock): RedirectResponse
    {
        $data = $this->validated($request);
        $product = Product::findOrFail($data['product_id']);
        $branch = Branch::findOrFail($data['branch_id']);
        $kind = $data['kind'];
        $note = $data['note'] ?? 'Recorded at the counter.';

        match ($kind) {
            'transfer' => $stock->transfer($product, $branch, Branch::findOrFail($data['to_branch']), (int) $data['quantity'], $request->user()),
            'adjustment' => $stock->adjust($product, $branch, 'adjustment', (int) $data['quantity'], $note, $request->user()),
            default => $stock->adjust($product, $branch, $kind, (int) $data['quantity'], $note, $request->user()),
        };

        return redirect()->to(route('admin.inventory.index', ['branch' => $data['branch_id']]))
            ->with('success', match ($kind) {
                'transfer' => 'Stock moved between branches.',
                'adjustment' => 'Stock corrected.',
                'damage' => 'Damaged stock written off.',
                'expired' => 'Expired stock written off.',
                default => 'Treatment usage recorded.',
            });
    }

    public function storeSupplier(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'contact_name' => ['nullable', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:160'],
            'address' => ['nullable', 'string', 'max:200'],
        ]);

        Supplier::updateOrCreate(['name' => $data['name']], $data);

        return back()->with('success', 'Supplier saved.');
    }

    /** What both stock forms need: the catalogue, the branches, the suppliers. */
    private function formProps(Request $request): array
    {
        return [
            'branch_id' => $request->integer('branch') ?: Branch::orderBy('id')->value('id'),
            'branches' => Branch::where('is_active', true)->orderBy('id')->get(['id', 'name']),
            'products' => Product::orderBy('name')->get(['id', 'name', 'sku', 'category', 'cost', 'price'])
                ->map(fn (Product $p) => $p->only(['id', 'name', 'sku', 'category', 'cost', 'price'])),
            'suppliers' => Supplier::where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ];
    }

    /** @return array<string, mixed> */
    private function validated(Request $request): array
    {
        return $request->validate([
            'product_id' => ['required', 'integer', Rule::exists('products', 'id')],
            'branch_id' => ['required', 'integer', Rule::exists('branches', 'id')],
            'to_branch' => ['nullable', 'integer', Rule::exists('branches', 'id')],
            'quantity' => ['required', 'integer', 'min:1', 'max:100000'],
            'kind' => ['nullable', Rule::in(['adjustment', 'damage', 'expired', 'consume', 'transfer'])],
            'lot_number' => ['nullable', 'string', 'max:60'],
            'expires_on' => ['nullable', 'date', 'after:today'],
            'received_on' => ['nullable', 'date', 'before_or_equal:today'],
            'supplier_id' => ['nullable', 'integer', Rule::exists('suppliers', 'id')],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'note' => ['nullable', 'string', 'max:200'],
        ], [
            'expires_on.after' => 'An expiry date has to be in the future.',
            'note.max' => 'Keep the note under 200 characters.',
        ]);
    }
}
