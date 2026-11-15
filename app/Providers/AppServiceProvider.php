<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureRateLimiting();
        $this->guardAgainstDebugLeaking();
    }

    /**
     * Throttle the two routes that accept a password.
     *
     * Before this, a wrong password could be guessed without limit. The limiter is
     * keyed on the submitted email *and* the client address, so an attacker cannot
     * lock a real customer out by hammering their address from somewhere else — the
     * two have to burn the same budget together.
     *
     * Five attempts a minute is enough for a person who mistyped, and far too few for
     * a dictionary attack.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('login', function (Request $request) {
            $key = Str::lower((string) $request->input('email')).'|'.$request->ip();

            return Limit::perMinute(5)->by($key)->response(
                fn () => back()->with('error', 'Terlalu banyak percobaan masuk. Tunggu satu menit, lalu coba lagi.')
            );
        });

        RateLimiter::for('register', function (Request $request) {
            return Limit::perHour(10)->by($request->ip())->response(
                fn () => back()->with('error', 'Terlalu banyak pendaftaran dari alamat ini. Coba lagi nanti.')
            );
        });
    }

    /**
     * Whether the application is about to show stack traces to the public.
     *
     * APP_DEBUG=true is correct on a developer's machine and dangerous anywhere else:
     * a single error exposes the database schema, file paths, and environment. This
     * does not switch it off — silently rewriting configuration hides the mistake.
     * It makes the mistake loud in the log instead, so it is found before a visitor
     * finds it.
     */
    public static function debugIsLeaking(): bool
    {
        // Reads config rather than app()->isLocal(). Both ultimately come from
        // APP_ENV, but `isLocal()` consults a binding frozen at bootstrap, so it
        // cannot be exercised by a test that changes the configuration. The question
        // being asked is "what will this deployment do", and that is answered by the
        // configuration actually in force.
        //
        // `testing` is excluded alongside `local`: a test run is not a deployment, and
        // warning on every suite would teach people to skim past the critical line
        // that matters.
        return ! in_array(config('app.env'), ['local', 'testing'], true)
            && (bool) config('app.debug');
    }

    private function guardAgainstDebugLeaking(): void
    {
        if (self::debugIsLeaking()) {
            Log::critical(
                'APP_DEBUG aktif di luar lingkungan local (APP_ENV='.config('app.env').'). '
                .'Jejak tumpukan akan terbuka ke pengguna. Setel APP_DEBUG=false.'
            );
        }
    }
}
