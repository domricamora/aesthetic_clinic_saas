<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The front desk's side of the website chat.
 *
 * A conversation is work somebody has to pick up, so the list is ordered by
 * when it was last touched rather than created, and the ones waiting for a
 * reply sit at the top. A chat nobody answers is worse than no chat, because
 * the visitor has been told to expect one.
 */
class ChatController extends Controller
{
    public function index(): Response
    {
        $conversations = ChatConversation::withCount('messages')
            ->latest('last_message_at')
            ->paginate(30);

        return Inertia::render('admin/chat/index', [
            'conversations' => $conversations->through(
                fn (ChatConversation $c) => $this->row($c),
            ),
            'unread' => $this->unreadCount(),
        ]);
    }

    /**
     * The same list as JSON, for the pages that keep themselves up to date.
     *
     * A chat that only appears when somebody presses Refresh is not much of a
     * chat: a visitor types a question and the desk is told nothing until
     * someone happens to reload. The inbox and the sidebar poll this instead.
     *
     * Deliberately not paginated. It backs a list that is already 30 long and
     * is re-read wholesale, so a page cursor would buy nothing and would make
     * merging a new row into the list considerably more work.
     */
    public function poll(): JsonResponse
    {
        return response()->json([
            'rows' => ChatConversation::withCount('messages')
                ->latest('last_message_at')
                ->limit(30)
                ->get()
                ->map(fn (ChatConversation $c) => $this->row($c)),
            'unread' => $this->unreadCount(),
        ]);
    }

    /** New messages in one open thread, for the reply window. */
    public function messages(ChatConversation $conversation): JsonResponse
    {
        // The desk has it open, so it is read whether or not they scroll.
        $conversation->messages()
            ->where('from', 'visitor')
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'messages' => $conversation->messages()
                ->with('author:id,name')
                ->orderBy('id')
                ->get()
                ->map(fn (ChatMessage $m) => $this->line($m)),
            'unread' => $this->unreadCount(),
        ]);
    }

    /**
     * One row of the inbox.
     *
     * `last_from` is here so the desk can tell at a glance whether the last
     * word was theirs or the visitor's. A preview beginning "Yes, before 5pm"
     * means nothing on its own; the same words after a staff avatar mean the
     * ball is not in their court.
     */
    private function row(ChatConversation $c): array
    {
        $last = $c->messages()->latest('id')->first();

        return [
            'id' => $c->id,
            'name' => $c->visitorName(),
            'phone' => $c->lead?->phone,
            'page' => $c->page,
            'preview' => $c->preview(),
            'unread' => $c->unreadCount(),
            'messages' => $c->messages_count,
            'last_from' => $last?->from,
            'last_at' => ($c->last_message_at ?? $c->created_at)?->toIso8601String(),
            'at' => ($c->last_message_at ?? $c->created_at)?->toIso8601String(),
        ];
    }

    private function line(ChatMessage $m): array
    {
        return [
            'from' => $m->from,
            'body' => $m->body,
            'who' => $m->from === 'staff' ? $m->author?->name : null,
            'at' => $m->created_at->toIso8601String(),
        ];
    }

    private function unreadCount(): int
    {
        return ChatConversation::whereHas(
            'messages',
            fn ($q) => $q->where('from', 'visitor')->whereNull('read_at'),
        )->count();
    }

    public function show(ChatConversation $conversation): Response
    {
        // Opening it is what marks it read; otherwise the badge tells the desk
        // somebody is waiting when somebody has already answered.
        $conversation->messages()
            ->where('from', 'visitor')
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return Inertia::render('admin/chat/show', [
            'conversation' => [
                'id' => $conversation->id,
                'name' => $conversation->visitorName(),
                'phone' => $conversation->lead?->phone,
                'page' => $conversation->page,
                'lead_id' => $conversation->lead_id,
            ],
            'messages' => $conversation->messages()
                ->with('author:id,name')
                ->orderBy('id')
                ->get()
                ->map(fn (ChatMessage $m) => $this->line($m)),
        ]);
    }

    public function reply(Request $request, ChatConversation $conversation): RedirectResponse
    {
        $data = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
        ], [
            'body.required' => 'Type a reply first.',
        ]);

        $conversation->messages()->create([
            'from' => 'staff',
            'user_id' => $request->user()->id,
            'body' => $data['body'],
        ]);

        $conversation->forceFill(['last_message_at' => now()])->save();

        return back();
    }

    public function close(ChatConversation $conversation): RedirectResponse
    {
        // Closed, not deleted: the record is the enquiry and the history of
        // what was said, which is worth keeping.
        $conversation->forceFill(['status' => 'closed'])->save();

        return back()->with('success', 'Conversation closed.');
    }
}
