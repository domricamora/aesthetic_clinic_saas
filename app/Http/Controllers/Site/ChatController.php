<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\ClinicSetting;
use App\Models\Lead;
use App\Models\Organization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

/**
 * The visitor's side of the chat window.
 *
 * A visitor is identified by a token in their own browser, not an account:
 * asking whether a treatment hurts should not require registering first, and
 * a sign-up wall in front of the question loses the enquiry.
 *
 * Nothing here accepts a conversation token belonging to somebody else, and
 * nothing here reads staff messages, so knowing a token grants the ability to
 * write to that conversation and nothing more.
 */
class ChatController extends Controller
{
    /** Whether the window is offered at all. */
    public function status(): JsonResponse
    {
        return response()->json([
            'enabled' => ClinicSetting::flag('chat.enabled'),
            'greeting' => ClinicSetting::get('chat.greeting', 'Hello. How can we help?'),
        ]);
    }

    /** Everything the visitor has sent and been told since they last looked. */
    public function show(Request $request, string $token): JsonResponse
    {
        $conversation = $this->visitorConversation($token);

        // Reading marks what the staff sent as seen, which is what stops the
        // badge sitting on their side forever after the visitor has left.
        $conversation->messages()
            ->where('from', 'staff')
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json($this->thread($conversation));
    }

    public function store(Request $request, string $token): JsonResponse
    {
        $data = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
            'name' => ['nullable', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:30'],
            'page' => ['nullable', 'string', 'max:200'],
        ], [
            'body.required' => 'Type a message first.',
        ]);

        // Per visitor, not per address: a shared office IP should not lock
        // everybody else out, and the token is what identifies them anyway.
        $key = 'chat:'.Str::transliterate(Str::lower($token));
        if (RateLimiter::tooManyAttempts($key, 20)) {
            return response()->json(['message' => 'Slow down a moment.'], 429);
        }
        RateLimiter::hit($key, 60);

        $conversation = $this->visitorConversation($token, creating: true);
        $conversation->forceFill(['page' => $data['page'] ?? $conversation->page])->save();

        $conversation->messages()->create([
            'from' => 'visitor',
            'body' => $data['body'],
        ]);

        // The moment the visitor gives us a way to reach them, this becomes an
        // enquiry the office can work. Until then it is a conversation.
        if ($conversation->lead_id === null && filled($data['name'] ?? null)) {
            $this->attachLead($conversation, $data);
        }

        $conversation->forceFill(['last_message_at' => now()])->save();

        return response()->json($this->thread($conversation), 201);
    }

    /**
     * Turns a conversation into an enquiry, once, so repeated messages do not
     * create a queue full of the same person.
     */
    private function attachLead(ChatConversation $conversation, array $data): void
    {
        $names = preg_split('/\s+/', trim((string) $data['name']), 2) ?: [null, null];

        $lead = Lead::create([
            'first_name' => $names[0],
            'last_name' => $names[1] ?? null,
            'phone' => $data['phone'] ?? null,
            'form' => 'chat',
            'source' => 'chat',
            'landing_page' => $conversation->page,
            'privacy_consent_at' => now(),
        ]);

        $lead->activities()->create([
            // "note" rather than something invented: the desk reads these as a
            // trail, and a chat enquiry is a note attached by nobody in
            // particular rather than a call somebody logged.
            'type' => 'note',
            'description' => 'Asked in the website chat: '
                .Str::limit((string) $data['body'], 200),
        ]);

        $conversation->forceFill(['lead_id' => $lead->id])->save();
    }

    /**
     * The conversation for this token, or a new one.
     *
     * Read without the tenant scope because a visitor is not signed in and has
     * no organisation to scope by; the tenant comes from the configured
     * clinic, and the token is the only thing proving which conversation this
     * is. A token from another installation simply is not here, so it 404s
     * rather than leaking a stranger's thread.
     */
    private function visitorConversation(string $token, bool $creating = false): ChatConversation
    {
        $organization = Organization::where('slug', config('clinic.organization'))->firstOrFail();

        $existing = ChatConversation::withoutGlobalScopes()
            ->where('organization_id', $organization->id)
            ->where('token', $token)
            ->first();

        if ($existing) {
            return $existing;
        }

        abort_unless($creating, 404);

        return ChatConversation::create([
            'organization_id' => $organization->id,
            'token' => $token,
            'status' => 'open',
        ]);
    }

    /** @return array<string, mixed> */
    private function thread(ChatConversation $conversation): array
    {
        return [
            'token' => $conversation->token,
            'messages' => $conversation->messages()
                ->orderBy('id')
                ->get(['from', 'body', 'created_at'])
                ->map(fn (ChatMessage $m) => [
                    'from' => $m->from,
                    'body' => $m->body,
                    'at' => $m->created_at->toIso8601String(),
                ]),
            'asked' => $conversation->lead_id !== null,
        ];
    }
}
