<?php
use Illuminate\Support\Facades\{Route, Auth};
use Illuminate\Http\Request;
use App\Http\Controllers\FinanceController;
use Inertia\Inertia;
Route::middleware('guest')->group(function () {
    Route::get('/login', fn () => Inertia::render('Auth', ['mode'=>'login']))->name('login');
    Route::get('/register', fn () => Inertia::render('Auth', ['mode'=>'register']));
    Route::post('/login', fn (Request $r) => app(FinanceController::class)->auth($r))->middleware('throttle:10,1');
    Route::post('/register', fn (Request $r) => app(FinanceController::class)->auth($r,'register'))->middleware('throttle:10,1');
});
Route::middleware('auth')->group(function () {
    Route::get('/', [FinanceController::class,'index']);
    Route::post('/finance/{resource}', [FinanceController::class,'save']);
    Route::put('/finance/{resource}/{id}', [FinanceController::class,'save']);
    Route::delete('/transactions/{id}', [FinanceController::class,'destroy']);
    Route::get('/export', [FinanceController::class,'export']);
    Route::post('/logout', function (Request $r) { Auth::logout(); $r->session()->invalidate(); $r->session()->regenerateToken(); return redirect('/login'); });
});
