<?php

namespace App\Actions\Media;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Puts a face on a staff record (plan.md 28).
 *
 * Photos land in public/media/photos/staff, the same place the rest of the
 * site's images already live, so they are served at /media/... rather than
 * behind a storage symlink. What is stored is a path rather than an absolute
 * URL, so the same record works on a laptop, on staging and on the live host
 * without being re-uploaded.
 *
 * Replacing a photo removes the file it replaced rather than leaving orphans
 * behind, and never touches an image the clinic did not upload through here.
 */
class UploadPhoto
{
    private const FOLDER = 'media/photos/staff';

    public function __invoke(UploadedFile $photo, string $name, ?string $previous = null): string
    {
        $extension = strtolower($photo->getClientOriginalExtension());

        if (! in_array($extension, ['jpg', 'jpeg', 'png', 'webp'], true)) {
            throw ValidationException::withMessages([
                'photo' => 'A photo has to be a JPG, PNG or WebP.',
            ]);
        }

        $directory = public_path(self::FOLDER);
        File::ensureDirectoryExists($directory, 0755);

        // A name someone can read beats a random string in a media library.
        $filename = Str::slug($name).'-'.Str::lower(Str::random(6)).'.'.$extension;
        $photo->move($directory, $filename);

        $this->discard($previous);

        return '/'.self::FOLDER.'/'.$filename;
    }

    /** Removes a photo this action wrote, leaving seeded or remote images alone. */
    public function discard(?string $path): void
    {
        if ($path === null || ! str_starts_with($path, '/'.self::FOLDER.'/')) {
            return;
        }

        File::delete(public_path(ltrim($path, '/')));
    }
}
