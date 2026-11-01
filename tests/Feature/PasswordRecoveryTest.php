<?php
namespace Tests\Feature;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\{Hash,Notification,Password};
use Tests\TestCase;

class PasswordRecoveryTest extends TestCase {
    use RefreshDatabase;
    protected function setUp(): void { parent::setUp();$this->withoutVite();Notification::fake(); }
    public function test_recovery_pages_and_email_delivery(): void {
        $this->get('/forgot-password')->assertOk();
        $user=User::factory()->create();
        $this->post('/forgot-password',['email'=>$user->email])->assertSessionHasNoErrors()->assertSessionHas('success');
        Notification::assertSentTo($user,ResetPassword::class,function ($notification) use ($user) {
            $this->get(route('password.reset',['token'=>$notification->token,'email'=>$user->email]))->assertOk();
            $this->assertStringContainsString('/reset-password/',$notification->toMail($user)->actionUrl);
            return true;
        });
        $this->post('/forgot-password',['email'=>'unknown@example.test'])->assertSessionHasNoErrors()->assertSessionHas('success');
        $this->post('/forgot-password',['email'=>'invalid'])->assertSessionHasErrors('email');
    }
    public function test_reset_requires_valid_token_and_confirmation_and_token_is_single_use(): void {
        $user=User::factory()->create(['password'=>'old-password']);
        $token=Password::createToken($user);
        $data=['email'=>$user->email,'token'=>$token,'password'=>'new-password','password_confirmation'=>'new-password'];
        $this->post('/reset-password',[...$data,'token'=>'invalid'])->assertSessionHasErrors('email');
        $this->post('/reset-password',[...$data,'password_confirmation'=>'mismatch'])->assertSessionHasErrors('password');
        $this->assertTrue(Hash::check('old-password',$user->fresh()->password));
        $this->post('/reset-password',$data)->assertRedirect('/login')->assertSessionHas('success');
        $this->assertTrue(Hash::check('new-password',$user->fresh()->password));
        $this->post('/reset-password',[...$data,'password'=>'another-password','password_confirmation'=>'another-password'])->assertSessionHasErrors('email');
        $this->assertTrue(Hash::check('new-password',$user->fresh()->password));
        $this->post('/login',['email'=>$user->email,'password'=>'new-password'])->assertRedirect('/');
        $this->assertAuthenticatedAs($user);
    }
    public function test_expired_tokens_are_rejected(): void {
        $user=User::factory()->create(['password'=>'old-password']);$token=Password::createToken($user);
        $this->travel(61)->minutes();
        $this->post('/reset-password',['email'=>$user->email,'token'=>$token,'password'=>'new-password','password_confirmation'=>'new-password'])->assertSessionHasErrors('email');
        $this->assertTrue(Hash::check('old-password',$user->fresh()->password));
    }
}
