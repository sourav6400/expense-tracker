<?php
use Illuminate\Support\Facades\{Route, Auth};
use Illuminate\Http\Request;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PasswordResetController;
use Inertia\Inertia;
Route::middleware('guest')->group(function () {
    Route::get('/forgot-password', [PasswordResetController::class,'request'])->name('password.request');
    Route::post('/forgot-password', [PasswordResetController::class,'send'])->middleware('throttle:5,1')->name('password.email');
    Route::get('/reset-password/{token}', [PasswordResetController::class,'edit'])->name('password.reset');
    Route::post('/reset-password', [PasswordResetController::class,'update'])->middleware('throttle:10,1')->name('password.update');
    Route::get('/login', fn () => Inertia::render('Auth', ['mode'=>'login']))->name('login');
    Route::get('/register', fn () => Inertia::render('Auth', ['mode'=>'register']));
    Route::get('/register/availability', [FinanceController::class,'availability'])->middleware('throttle:60,1');
    Route::post('/login', fn (Request $r) => app(FinanceController::class)->auth($r))->middleware('throttle:10,1');
    Route::post('/register', fn (Request $r) => app(FinanceController::class)->auth($r,'register'))->middleware('throttle:10,1');
});
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class,'show']);
    Route::post('/profile', [ProfileController::class,'update']);
    Route::put('/profile/password', [ProfileController::class,'password'])->middleware('throttle:10,1');
    Route::get('/profile/photo', [ProfileController::class,'photo']);
    Route::get('/', [FinanceController::class,'index']);
    Route::get('/finance/{resource}/create', [FinanceController::class,'editor']);
    Route::get('/finance/{resource}/{id}/edit', [FinanceController::class,'editor'])->whereNumber('id');
    Route::post('/finance/{resource}', [FinanceController::class,'save']);
    Route::put('/finance/{resource}/{id}', [FinanceController::class,'save']);
    Route::delete('/transactions/{id}', [FinanceController::class,'destroy']);
    Route::delete('/accounts/{id}', [FinanceController::class,'destroyAccount']);
    Route::delete('/categories/{id}', [FinanceController::class,'destroyCategory']);
    Route::get('/export', [FinanceController::class,'export']);
    Route::post('/logout', function (Request $r) { Auth::logout(); $r->session()->invalidate(); $r->session()->regenerateToken(); return redirect('/login'); });
});
