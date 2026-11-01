<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Hash, Storage};
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function show() { return Inertia::render('Profile'); }

    public function update(Request $request) {
        $request->merge(['username'=>strtolower(trim((string) $request->input('username')))]);
        $user=$request->user();
        $data=$request->validate([
            'name'=>'required|string|max:100',
            'username'=>['required','string','min:3','max:30','regex:/^[a-z0-9_]+$/',Rule::unique('users','username')->ignore($user->id)],
            'photo'=>'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ],['username.regex'=>'Use letters, numbers, and underscores only.']);
        $oldPath=$user->profile_photo_path;
        $path=null;
        if ($request->hasFile('photo')) {
            $path=$request->file('photo')->store('avatars','local');
            abort_unless($path,500,'Unable to save profile photo.');
        }
        try {
            $user->name=$data['name'];
            $user->username=$data['username'];
            if ($path) $user->profile_photo_path=$path;
            $user->save();
        } catch (\Throwable $e) {
            if ($path) Storage::disk('local')->delete($path);
            throw $e;
        }
        if ($path && $oldPath) Storage::disk('local')->delete($oldPath);
        return back()->with('success','Profile updated successfully.');
    }

    public function password(Request $request) {
        $data=$request->validate([
            'current_password'=>'required|current_password',
            'password'=>'required|string|min:8|max:255|confirmed|different:current_password',
        ]);
        $request->user()->forceFill(['password'=>Hash::make($data['password']),'remember_token'=>null])->save();
        $request->session()->regenerate();
        return back()->with('success','Password changed successfully.');
    }

    public function photo(Request $request) {
        $path=$request->user()->profile_photo_path;
        abort_unless($path && Storage::disk('local')->exists($path),404);
        return response()->file(Storage::disk('local')->path($path),['Cache-Control'=>'private, no-store','X-Content-Type-Options'=>'nosniff']);
    }
}
