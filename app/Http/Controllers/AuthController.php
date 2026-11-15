<?php

namespace App\Http\Controllers;

// Koneksi DB (Menggunakan Model User / Eloquent ORM yang terhubung ke database msi_db)
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class AuthController extends Controller
{
    // ==========================================
    // LOGIN
    // ==========================================
    public function showLogin()
    {
        // The seeded accounts are a convenience for working on the app locally and
        // a published credential anywhere else. They are handed to the page as a
        // prop, and only on a development machine, so no deployment can serve a
        // working administrator password on its public sign-in sheet.
        $demoAccounts = app()->environment('local')
            ? [
                ['role' => 'Admin', 'email' => 'admin@gmail.com', 'password' => 'password', 'scope' => 'Konsol kendali'],
                ['role' => 'Pelanggan', 'email' => 'rama@gmail.com', 'password' => 'password', 'scope' => 'Portal pengguna'],
            ]
            : [];

        return Inertia::render('Auth/Login', [
            'demoAccounts' => $demoAccounts,
        ]);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();

            $user = Auth::user();
            if ($user->isAdmin()) {
                return redirect()->route('admin.dashboard')->with('success', "Selamat datang kembali, Admin {$user->name}!");
            }

            return redirect()->intended('/')->with('success', "Selamat datang kembali, {$user->name}!");
        }

        return back()->withErrors([
            'email' => 'Kombinasi email dan password salah.',
        ])->onlyInput('email');
    }

    // ==========================================
    // REGISTER
    // ==========================================
    public function showRegister()
    {
        return Inertia::render('Auth/Register');
    }

    public function register(Request $request)
    {
        $validated = $request->validate([
            'username' => 'required|string|max:100',
            'email' => 'required|string|email|max:255|unique:users',
            'password_1' => 'required|string|min:6',
            'password_2' => 'required|same:password_1',
            'phone' => 'nullable|string|max:25',
            'address' => 'nullable|string|max:255',
        ], [
            'password_2.same' => 'Konfirmasi password tidak cocok dengan password utama.',
            'email.unique' => 'Email ini sudah terdaftar di sistem.',
        ]);

        $user = User::create([
            'name' => $validated['username'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password_1']),
            'role' => 'customer',
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
        ]);

        // Menyimpan ke tabel user_info (akan memicu Trigger MySQL after_user_info_insert ke user_info_backup)
        DB::table('user_info')->insert([
            'first_name' => $validated['username'],
            'last_name' => '',
            'email' => $validated['email'],
            'password' => md5($validated['password_1']),
            'mobile' => $validated['phone'] ?? '',
            'address1' => $validated['address'] ?? '',
            'address2' => '',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Auth::login($user);

        return redirect()->route('shop.index')->with('success', "Registrasi berhasil! Selamat datang di Online Shop, {$user->name}.");
    }

    // ==========================================
    // LOGOUT
    // ==========================================
    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('shop.index')->with('success', 'Anda telah berhasil logout.');
    }
}
