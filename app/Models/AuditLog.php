<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * A record of somebody having done something (plan.md §31).
 *
 * Read-only from the application's point of view: there is no edit path and no
 * delete path, because a log that can be altered is not a log. Retention is a
 * matter for the operator and belongs in a scheduled prune, not in a button on
 * a screen.
 */
class AuditLog extends Model
{
    use BelongsToOrganization;

    /** The actions worth writing down, grouped so a screen can filter on them. */
    public const GROUPS = [
        'auth' => 'Sign in and accounts',
        'sale' => 'Sales and refunds',
        'inventory' => 'Stock',
        'payroll' => 'Payroll',
        'accounting' => 'Accounting',
        'settings' => 'Settings and permissions',
    ];

    public const UPDATED_AT = null;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['context' => 'array'];
    }

    /**
     * Writes one entry.
     *
     * @param  array<string, mixed>  $context
     */
    public static function record(
        string $action,
        string $description,
        ?Model $subject = null,
        array $context = [],
        ?Request $request = null,
    ): self {
        $request ??= request();

        return static::create([
            'user_id' => Auth::id(),
            'action' => $action,
            'subject_type' => $subject ? $subject::class : null,
            'subject_id' => $subject?->getKey(),
            'description' => $description,
            'context' => $context ?: null,
            'ip_address' => $request->ip(),
            'user_agent' => str($request->userAgent() ?? '')->limit(255)->value() ?: null,
        ]);
    }

    /** "sale.refund" shown as "refund", for a table. */
    public function verb(): string
    {
        return str($this->action)->afterLast('.')->value();
    }

    public function group(): string
    {
        return str($this->action)->before('.')->value();
    }

    public function groupLabel(): string
    {
        return self::GROUPS[$this->group()] ?? $this->group();
    }

    public function actorName(): string
    {
        return $this->user?->name ?? 'System';
    }
}
