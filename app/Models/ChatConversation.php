<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/** One visitor talking to the front desk. See the migration for the why. */
class ChatConversation extends Model
{
    use BelongsToOrganization;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['last_message_at' => 'datetime'];
    }

    /** @return HasMany<ChatMessage, $this> */
    public function messages(): HasMany
    {
        return $this->hasMany(ChatMessage::class);
    }

    /** @return BelongsTo<Lead, $this> */
    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    /**
     * Who the visitor is, which only exists once somebody asked.
     *
     * Taken from the lead when there is one, so a conversation that became an
     * enquiry shows the name the front desk knows rather than whatever the
     * last message happened to be called.
     */
    public function visitorName(): string
    {
        return $this->lead?->fullName() ?? 'Website visitor';
    }

    /** The line the front desk shows as a preview, trimmed to one row. */
    public function preview(): string
    {
        return Str::limit(
            (string) $this->messages()->latest('id')->value('body'),
            120,
        );
    }

    /** How many messages the staff have not read yet. */
    public function unreadCount(): int
    {
        return $this->messages()->where('from', 'visitor')->whereNull('read_at')->count();
    }
}
