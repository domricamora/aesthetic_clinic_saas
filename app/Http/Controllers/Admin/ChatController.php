<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
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
            ->with('lead:id,first_name,last_name,phone')
            ->latest('last_message_at')
            ->paginate(30);

        return Inertia::render('admin/chat/index', [
            'conversations' => $conversations->through(fn (ChatConversation $c) => [
                'id' => $c->id,
                'token' => $c->token,
                'name' => $c->visitorName(),
                'phone' => $c->lead?->phone,
                'page' => $c->page,
                'preview' => $c->preview(),
                'unread' => $c->unreadCount(),
                'messages' => $c->messages_count,
                'at' => ($c->last_message_at ?? $c->created_at)?->toIso8601String(),
            ]),
            'unread' => ChatConversation::whereHas(
                'messages',
                fn ($q) => $q->where('from', 'visitor')->whereNull('read_at'),
            )->count(),
        ]);
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
                ->map(fn (ChatMessage $m) => [
                    'from' => $m->from,
                    'body' => $m->body,
                    'who' => $m->from === 'staff' ? $m->author?->name : null,
                    'at' => $m->created_at->toIso8601String(),
                ]),
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
