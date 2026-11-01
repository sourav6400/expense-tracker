<?php
namespace App\Http\Controllers;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Hash,Password};
use Illuminate\Support\Str;
use Inertia\Inertia;

class PasswordResetController extends Controller {
    public function request() { return Inertia::render('PasswordRecovery',['mode'=>'request']); }
    public function send(Request $request) {
        $data=$request->validate(['email'=>'required|email|max:255']);
        try { Password::sendResetLink($data); }
        catch (\Throwable $exception) {
            report($exception);
            return back()->withErrors(['email'=>'Unable to send a recovery email right now. Please try again later.']);
        }
        return back()->with('success','If an account exists with that email, a password reset link has been sent. Check your inbox and spam folder.');
    }
    public function edit(Request $request,string $token) {
        return Inertia::render('PasswordRecovery',['mode'=>'reset','token'=>$token,'email'=>(string) $request->query('email','')]);
    }
    public function update(Request $request) {
        $data=$request->validate(['token'=>'required|string','email'=>'required|email|max:255','password'=>'required|string|min:8|max:255|confirmed']);
        $status=Password::reset($data,function ($user,$password) {
            $user->forceFill(['password'=>Hash::make($password),'remember_token'=>Str::random(60)])->save();
            event(new PasswordReset($user));
        });
        if ($status!==Password::PASSWORD_RESET) return back()->withErrors(['email'=>'This reset link is invalid or has expired. Please request a new one.']);
        return redirect('/login')->with('success','Password reset successfully. Sign in with your new password.');
    }
}
