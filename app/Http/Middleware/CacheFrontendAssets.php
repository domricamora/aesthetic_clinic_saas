<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Stops a browser quietly serving a build that is no longer on the server.
 *
 * Vite's files are content-hashed, so they are safe to cache forever and are
 * what makes a deploy atomic: a document asks for a name, and the name either
 * exists or it does not. That only holds if the document itself is never
 * served from a cache, though. With a plain reload the browser may revalidate
 * a stored copy, be told "not modified", and keep running the JavaScript it
 * already had. When that JavaScript is an older build whose links point
 * somewhere that no longer exists, the visitor clicks through a site that
 * looks fine and 404s on every menu item, and nothing in the server logs
 * says why.
 *
 * So: never store a document, and let the hashed assets live forever.
 */
class CacheFrontendAssets
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // The hashed assets keep whatever caching the server already sets: the
        // name in the path is the hash of the contents, so a browser holding one
        // is holding the right bytes. Only the document needs stopping.
        if (! $request->expectsJson() && ! $request->is('build/*')) {
            $response->headers->set('Cache-Control', 'no-store, max-age=0, must-revalidate');
        }

        return $response;
    }
}
