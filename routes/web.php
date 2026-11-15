<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\HardwareController;
use App\Http\Controllers\KmsController;
use App\Http\Controllers\MsiController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\SoftwareController;
use Illuminate\Support\Facades\Route;

// Customer Storefront Routes
//
// Browsing is public. Buying is not.
Route::get('/', [ShopController::class, 'index'])->name('shop.index');
Route::get('/product/{product:slug}', [ShopController::class, 'product'])->name('shop.product');

/*
 * Everything from the bag onward belongs to a named person, so it says so in the
 * route table rather than in a check buried at the top of each controller method.
 *
 * The purchase flow is one continuous act: a bag, a checkout, an order, a receipt,
 * a history. Any of those standing open to a passer-by makes the rest of them
 * fictional — a bag nobody owns, an order addressed to nobody, a receipt anyone can
 * read. So the whole run is behind `auth`, from the first item added to the last
 * receipt opened.
 *
 * The session is regenerated on sign-in rather than replaced, so a bag filled
 * before signing in survives it; and the middleware remembers where the reader was
 * going, so they arrive there once they are through.
 */
Route::middleware('auth')->group(function () {
    // Shopping Cart
    Route::get('/cart', [ShopController::class, 'cart'])->name('shop.cart');
    Route::post('/cart/add', [ShopController::class, 'addToCart'])->name('shop.cart.add');
    Route::post('/cart/update', [ShopController::class, 'updateCart'])->name('shop.cart.update');
    Route::get('/cart/remove/{product}', [ShopController::class, 'removeFromCart'])->name('shop.cart.remove');

    // Checkout & Orders
    Route::get('/checkout', [ShopController::class, 'checkout'])->name('shop.checkout');
    Route::post('/checkout/process', [ShopController::class, 'processCheckout'])->name('shop.checkout.process');
    Route::get('/order/success/{order}', [ShopController::class, 'orderSuccess'])->name('shop.order-success');

    // The customer's own register of orders, kept reachable for links that already
    // point at it: it is now the second tab of the bag rather than a page of its own,
    // because there was no way to reach it and a register nobody can find is not a
    // feature.
    Route::get('/my-orders', fn () => redirect()->route('shop.cart', ['tab' => 'orders']))
        ->name('shop.my-orders');

    Route::get('/user', [ShopController::class, 'userDashboard'])->name('user.dashboard');
    Route::get('/user/profile', [ShopController::class, 'userDashboard'])->name('user.profile');
    Route::put('/user/profile', [ShopController::class, 'updateUserProfile'])->name('user.profile.update');
});

// Newsletter Subscription (Table email_info)
Route::post('/newsletter/subscribe', [ShopController::class, 'subscribeNewsletter'])->name('newsletter.subscribe');

// BAB II: Tipe Sistem Informasi
Route::get('/pyramid', [MsiController::class, 'pyramid'])->name('pyramid');
Route::get('/tps', [MsiController::class, 'tps'])->name('tps');
Route::post('/tps/store', [MsiController::class, 'tpsStore'])->name('tps.store');
Route::post('/tps/process-batch', [MsiController::class, 'tpsProcessBatch'])->name('tps.batch');
Route::get('/oas', [MsiController::class, 'oas'])->name('oas');
Route::post('/oas/store', [MsiController::class, 'oasStore'])->name('oas.store');
Route::post('/oas/tasks', [MsiController::class, 'oasTaskStore'])->name('oas.tasks.store');
Route::patch('/oas/tasks/{oasTask}/toggle', [MsiController::class, 'oasTaskToggle'])->name('oas.tasks.toggle');
Route::get('/mis', [MsiController::class, 'mis'])->name('mis');
Route::get('/iss', [MsiController::class, 'iss'])->name('iss');
Route::post('/iss/diagnose', [MsiController::class, 'issDiagnose'])->name('iss.diagnose');
Route::post('/iss/eis-ask', [MsiController::class, 'issExecutiveAsk'])->name('iss.eis.ask');
Route::get('/matrix', [MsiController::class, 'matrix'])->name('matrix');
Route::get('/quiz', [MsiController::class, 'quiz'])->name('quiz');
Route::post('/quiz/submit', [MsiController::class, 'quizSubmit'])->name('quiz.submit');

// BAB X: Knowledge Management System & Chatbot
Route::get('/kms', [KmsController::class, 'index'])->name('kms');
Route::post('/kms/articles', [KmsController::class, 'storeArticle'])->name('kms.articles.store');
Route::post('/kms/chatbot', [KmsController::class, 'storeChatbotRule'])->name('kms.chatbot.store');
Route::delete('/kms/chatbot/{chatbotRule}', [KmsController::class, 'deleteChatbotRule'])->name('kms.chatbot.delete');
Route::post('/chatbot/message', [KmsController::class, 'askChatbot'])->name('chatbot.message');

// BAB III: Perangkat Keras Sistem
Route::get('/hardware', [HardwareController::class, 'index'])->name('hardware.index');
Route::post('/hardware/quiz', [HardwareController::class, 'submitQuiz'])->name('hardware.quiz.submit');

// BAB IV: Perangkat Lunak Komputer untuk Sistem Informasi
Route::get('/software', [SoftwareController::class, 'index'])->name('software.index');
Route::post('/software/run-procedure', [SoftwareController::class, 'runProcedure'])->name('software.procedure');
Route::post('/software/quiz', [SoftwareController::class, 'submitQuiz'])->name('software.quiz.submit');

// Authentication Routes
//
// The two POST routes that accept a password are throttled. The limiters are named
// rather than inline (`throttle:5,1`) because a named limiter can answer with a
// message a person can read, and can be keyed on the submitted email rather than
// only on the client address. Neither limit applies to the GET routes: reading a
// form is not an attempt.
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:login')
    ->name('login.process');
Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
Route::post('/register', [AuthController::class, 'register'])
    ->middleware('throttle:register')
    ->name('register.process');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Admin Control Panel Routes
//
// `auth` establishes that somebody is signed in; `admin` establishes that it is an
// administrator. The whole group was public — not merely visible, but *writable*:
// every route here that creates, edits and deletes catalogue rows and moves order
// statuses could be called with no session at all. Both middlewares are needed and
// neither is optional.
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [AdminController::class, 'dashboard'])->name('dashboard');
    Route::get('/products', [AdminController::class, 'products'])->name('products');
    Route::post('/products/store', [AdminController::class, 'storeProduct'])->name('products.store');
    Route::put('/products/{product}', [AdminController::class, 'updateProduct'])->name('products.update');
    Route::delete('/products/{product}', [AdminController::class, 'deleteProduct'])->name('products.delete');

    Route::get('/categories', [AdminController::class, 'categories'])->name('categories');
    Route::post('/categories/store', [AdminController::class, 'storeCategory'])->name('categories.store');
    Route::delete('/categories/{category}', [AdminController::class, 'deleteCategory'])->name('categories.delete');

    Route::get('/orders', [AdminController::class, 'orders'])->name('orders');
    Route::put('/orders/{order}/status', [AdminController::class, 'updateOrderStatus'])->name('orders.status');

    Route::get('/users', [AdminController::class, 'users'])->name('users');
});
