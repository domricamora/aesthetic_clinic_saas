<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Remembers where a visitor first came from so every lead records its
 * marketing source (plan.md 55). First touch wins for the session.
 */
class CaptureAttribution
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isMethod('GET') && ! $request->session()->has('attribution')) {
            $agent = (string) $request->userAgent();
            $request->session()->put('attribution', [
                'utm_source' => Str::limit((string) $request->query('utm_source'), 250, '') ?: null,
                'utm_medium' => Str::limit((string) $request->query('utm_medium'), 250, '') ?: null,
                'utm_campaign' => Str::limit((string) $request->query('utm_campaign'), 250, '') ?: null,
                'landing_page' => Str::limit($request->fullUrl(), 250, ''),
                'referrer' => Str::limit((string) $request->headers->get('referer'), 250, '') ?: null,
                'device' => preg_match('/Mobi|Android|iPhone/i', $agent) ? 'mobile' : (preg_match('/iPad|Tablet/i', $agent) ? 'tablet' : 'desktop'),
            ]);
        }

        return $next($request);
    }
}
