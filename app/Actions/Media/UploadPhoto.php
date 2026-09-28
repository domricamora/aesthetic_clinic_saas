<?php

namespace App\Actions\Media;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Puts an uploaded photo away as WebP, always (plan.md 50).
 *
 * One format everywhere means one decision to make once: browsers that
 * understand it serve a photo at a fraction of the size, and the media library
 * does not fill up with the same picture five times. Everything lands in
 * public/media/photos/{folder} alongside the rest of the site's images, so it
 * is served at /media/... rather than behind a storage symlink, and what is
 * stored is a path rather than an absolute URL, which means one record works
 * on a laptop, on staging and on the live host.
 *
 * Replacing a photo removes the file it replaced rather than leaving orphans
 * behind, and never touches an image the clinic did not upload through here.
 */
class UploadPhoto
{
    /**
     * Nothing on a clinic site needs to be bigger than this on the long edge.
     *
     * This is also what keeps the conversion inside a normal PHP memory
     * limit: GD holds the decoded original and the scaled copy at the same
     * time, so a 12 megapixel phone photo costs roughly 70MB before it is
     * written. Long edge capped at 2000 keeps that affordable.
     */
    private const MAX_EDGE = 2000;

    private const QUALITY = 82;

    public function __construct(private readonly string $folder = 'staff') {}

    public function __invoke(UploadedFile $photo, string $name, ?string $previous = null): string
    {
        $extension = strtolower($photo->getClientOriginalExtension());

        if (! in_array($extension, ['jpg', 'jpeg', 'png', 'webp'], true)) {
            throw ValidationException::withMessages([
                'photo' => 'A photo has to be a JPG, PNG or WebP.',
            ]);
        }

        if (! function_exists('imagewebp')) {
            throw ValidationException::withMessages([
                'photo' => 'This server cannot convert photos to WebP, so the upload was not saved.',
            ]);
        }

        $source = $this->scale($this->read($photo->getRealPath(), $extension));

        $directory = public_path("media/photos/{$this->folder}");
        File::ensureDirectoryExists($directory, 0755);

        // A name someone can read beats a random string in a media library.
        $filename = Str::slug($name).'-'.Str::lower(Str::random(6)).'.webp';
        $target = $directory.'/'.$filename;

        if (! imagewebp($source, $target, self::QUALITY)) {
            imagedestroy($source);

            throw ValidationException::withMessages(['photo' => 'That photo did not convert. Try another.']);
        }

        imagedestroy($source);
        $this->discard($previous);

        return "/media/photos/{$this->folder}/{$filename}";
    }

    /** Removes a photo this action wrote, leaving seeded or remote images alone. */
    public function discard(?string $path): void
    {
        if ($path === null || ! str_starts_with($path, "/media/photos/{$this->folder}/")) {
            return;
        }

        File::delete(public_path(ltrim($path, '/')));
    }

    /** @return \GdImage */
    private function read(string $path, string $extension)
    {
        $image = match ($extension) {
            'png' => @imagecreatefrompng($path),
            'webp' => @imagecreatefromwebp($path),
            default => @imagecreatefromjpeg($path),
        };

        if ($image === false) {
            throw ValidationException::withMessages(['photo' => 'That file could not be read as a photo.']);
        }

        // A photo taken on a phone records which way up it was held; without
        // this it can arrive on the website lying on its side.
        if (in_array($extension, ['jpg', 'jpeg'], true) && function_exists('exif_read_data')) {
            return $this->upright($image, $path);
        }

        return $image;
    }

    /**
     * @return \GdImage the image to carry on with, which may be a rotated copy
     */
    private function upright(\GdImage $image, string $path): \GdImage
    {
        $exif = @exif_read_data($path) ?: [];

        $rotated = match ((int) ($exif['Orientation'] ?? 1)) {
            3 => imagerotate($image, 180, 0),
            6 => imagerotate($image, -90, 0),
            8 => imagerotate($image, 90, 0),
            default => false,
        };

        if ($rotated === false) {
            return $image;
        }

        imagedestroy($image);

        return $rotated;
    }

    /**
     * Keeps the proportions and never enlarges a picture that is already small.
     *
     * @return \GdImage the image to carry on with, which may be a smaller copy
     */
    private function scale(\GdImage $image): \GdImage
    {
        $width = imagesx($image);
        $height = imagesy($image);
        $longest = max($width, $height);

        if ($longest <= self::MAX_EDGE) {
            return $image;
        }

        $ratio = self::MAX_EDGE / $longest;
        $resized = imagecreatetruecolor((int) round($width * $ratio), (int) round($height * $ratio));

        // Keep transparency when a logo or a PNG is scaled down.
        imagealphablending($resized, false);
        imagesavealpha($resized, true);
        imagecopyresampled($resized, $image, 0, 0, 0, 0, imagesx($resized), imagesy($resized), $width, $height);
        imagedestroy($image);

        return $resized;
    }
}
