<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;

/**
 * A setting the clinic changes itself.
 *
 * Everything that reaches the public site is asked for by name and handed back
 * typed, so a row that was never written, or was written badly, produces a
 * sensible default rather than a null in the middle of a template.
 */
class ClinicSetting extends Model
{
    use BelongsToOrganization;

    /** Platforms the footer knows how to draw, and what each one's url looks like. */
    public const SOCIALS = [
        'facebook' => 'https://facebook.com/',
        'instagram' => 'https://instagram.com/',
        'tiktok' => 'https://tiktok.com/@',
        'linkedin' => 'https://linkedin.com/company/',
        'x' => 'https://x.com/',
        'youtube' => 'https://youtube.com/@',
    ];

    protected $guarded = ['id'];

    /**
     * The social handles to link, saved by the office or configured.
     *
     * The config is the fallback rather than the only source: an installation
     * that has never opened the settings screen still shows the handles it was
     * deployed with, and saving from the screen takes over from there.
     *
     * @return array<string, string> platform => full url
     */
    public static function socials(): array
    {
        $links = [];

        foreach (self::SOCIALS as $platform => $base) {
            $handle = self::get('social.'.$platform)
                ?? self::normaliseHandle(config('clinic.social.'.$platform));

            if ($handle !== null) {
                $links[$platform] = $base.$handle;
            }
        }

        return $links;
    }

    /** A single setting, or the fallback when this clinic has never set it. */
    public static function get(string $key, mixed $default = null): mixed
    {
        $row = static::query()->where('key', $key)->first();

        return $row?->value ?? $default;
    }

    /** A setting as a boolean, so "0" and an empty box both read as off. */
    public static function flag(string $key, bool $default = false): bool
    {
        $value = static::get($key);

        return $value === null ? $default : filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }

    /** Writes a setting, or removes it when the value is blank. */
    public static function put(string $key, ?string $value): void
    {
        if ($value === null || trim($value) === '') {
            static::query()->where('key', $key)->delete();

            return;
        }

        static::query()->updateOrCreate(
            ['key' => $key],
            ['value' => trim($value)],
        );
    }

    /**
     * Normalises a handle typed by an office into the part after the domain.
     *
     * Somebody will paste a full profile URL rather than a handle, and the
     * alternative is a footer link to facebook.com/https://facebook.com/x.
     *
     * @return string|null the handle, or null if what was typed is not a link
     */
    public static function normaliseHandle(?string $value): ?string
    {
        $value = trim((string) $value);

        if ($value === '') {
            return null;
        }

        if (preg_match('#^https?://#i', $value)) {
            $path = trim((string) parse_url($value, PHP_URL_PATH), '/');
            $segments = explode('/', $path);
            $value = end($segments) ?: '';
        }

        $value = ltrim(trim($value), '/@');

        // Reject anything with whitespace or a scheme left in it rather than
        // emitting a link that goes nowhere.
        if ($value === '' || preg_match('#[\s"<>\\\\]#', $value)) {
            return null;
        }

        return $value;
    }
}
