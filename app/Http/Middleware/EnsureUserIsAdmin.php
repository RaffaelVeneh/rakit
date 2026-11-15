<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Only an administrator reaches the console.
 *
 * The application already knew who its administrators were — `users.role` carries
 * `admin`, and `User::isAdmin()` reads it — but nothing ever asked. The entire
 * `/admin` group, including every route that creates, edits and deletes catalogue
 * rows and moves order statuses, was reachable with no session at all, so a
 * stranger could rewrite the catalogue and no page anywhere recorded that they
 * had.
 *
 * Authentication and authorisation are two different questions and this answers
 * the second. `auth` establishes that somebody is signed in; this establishes
 * *who*. A signed-in customer is not an administrator, and the difference between
 * those two states is the whole reason the console is separate from the storefront.
 *
 * A refusal is a 403 rather than a redirect. Sending a signed-in customer to the
 * sign-in page they have already passed would be a lie about why they were
 * stopped, and it would loop: they sign in again and arrive back at the same wall.
 */
class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            // Reachable when this middleware is used without `auth` in front of it.
            return $request->expectsJson()
                ? response()->json(['message' => 'Unauthenticated.'], 401)
                : redirect()->guest(route('login'));
        }

        if (! $user->isAdmin()) {
            abort(403, 'Konsol kendali hanya untuk administrator.');
        }

        return $next($request);
    }
}
