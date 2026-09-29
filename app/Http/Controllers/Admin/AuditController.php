<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The audit trail (plan.md §31).
 *
 * Read-only by design. There is no way to edit or delete an entry from here,
 * because a log somebody can tidy up is not evidence of anything. The one
 * question this screen exists to answer is "who did this and when", and that
 * question has to have the same answer next month as it has today.
 */
class AuditController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'group' => ['nullable', 'string', 'max:40'],
            'q' => ['nullable', 'string', 'max:80'],
        ]);

        $entries = AuditLog::with('user:id,name')
            ->when($filters['group'] ?? null, fn ($q, $group) => $q->where('action', 'like', $group.'%'))
            ->when($filters['q'] ?? null, fn ($q, $term) => $q->where('description', 'like', "%{$term}%"))
            ->latest('id')
            ->paginate(40)
            ->withQueryString();

        return Inertia::render('admin/audit/index', [
            'entries' => $entries->through(fn (AuditLog $log) => [
                'id' => $log->id,
                'action' => $log->action,
                'group' => $log->group(),
                'group_label' => $log->groupLabel(),
                'description' => $log->description,
                'who' => $log->actorName(),
                'context' => $log->context,
                'ip' => $log->ip_address,
                'at' => $log->created_at->toIso8601String(),
            ]),
            'groups' => collect(AuditLog::GROUPS)
                ->map(fn (string $label, string $key) => ['key' => $key, 'label' => $label])
                ->values()
                ->all(),
            'group' => $filters['group'] ?? 'all',
            'query' => $filters['q'] ?? '',
            'total' => AuditLog::count(),
        ]);
    }
}
