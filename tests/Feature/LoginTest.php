<?php
namespace Tests\Feature;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginTest extends TestCase {
    use RefreshDatabase;
    public function test_registration_availability_checks_existing_and_unused_values(): void {
        User::factory()->create(['email'=>'alex@example.test','username'=>'alex_123']);
        foreach ([['username','ALEX_123',false],['username','new_user',true],['email','alex@example.test',false],['email','new@example.test',true]] as [$field,$value,$available]) {
            $response=$this->getJson('/register/availability?'.http_build_query(compact('field','value')));
            $response->assertOk()->assertExactJson(['available'=>$available]);
            $this->assertStringContainsString('no-store',$response->headers->get('Cache-Control'));
        }
        $this->getJson('/register/availability?field=password&value=secret')->assertUnprocessable();
        $this->getJson('/register/availability?field=username&value=ab')->assertUnprocessable();
        $this->getJson('/register/availability?field=email&value=invalid')->assertUnprocessable();
    }
    public function test_duplicate_registration_is_blocked_even_when_availability_is_bypassed(): void {
        User::factory()->create(['username'=>'existing_user','email'=>'existing@example.test']);
        $payload=['name'=>'New user','username'=>'EXISTING_USER','email'=>'existing@example.test','password'=>'password123'];
        $this->post('/register',$payload)->assertSessionHasErrors(['username','email']);
        $this->assertGuest();
        $this->assertDatabaseCount('users',1);
        $this->assertDatabaseCount('accounts',0);
    }
    public function test_registration_requires_a_unique_username_and_allows_immediate_username_login(): void {
        $payload=['name'=>'Alex','email'=>'alex@example.test','password'=>'password123'];
        $this->post('/register',$payload)->assertSessionHasErrors('username');
        foreach (['ab','bad name',str_repeat('a',31)] as $username) {
            $this->post('/register',[...$payload,'username'=>$username])->assertSessionHasErrors('username');
        }
        $this->post('/register',[...$payload,'username'=>'Alex_123'])->assertRedirect('/');
        $this->assertDatabaseHas('users',['email'=>'alex@example.test','username'=>'alex_123']);
        $this->post('/logout');
        $this->post('/register',[...$payload,'email'=>'other@example.test','username'=>'ALEX_123'])->assertSessionHasErrors('username');
        $this->assertDatabaseCount('users',1);
        $this->post('/login',['email'=>'alex_123','password'=>'password123'])->assertRedirect('/');
        $this->assertAuthenticated();
    }
    public function test_users_can_sign_in_with_email_or_username(): void {
        $user=User::factory()->create(['email'=>'alex@example.test','password'=>'password123']);
        $user->forceFill(['username'=>'alex_123'])->save();
        foreach (['alex@example.test','alex_123','ALEX_123'] as $identifier) {
            $this->post('/login',['email'=>$identifier,'password'=>'password123'])->assertSessionHasNoErrors()->assertRedirect('/');
            $this->assertAuthenticatedAs($user);
            $this->post('/logout');
        }
    }
    public function test_invalid_identifiers_or_passwords_cannot_sign_in(): void {
        $user=User::factory()->create(['password'=>'password123']);
        $user->forceFill(['username'=>'alex_123'])->save();
        foreach ([['alex_123','wrongpassword'],['missing_user','password123'],[$user->email,'wrongpassword']] as [$identifier,$password]) {
            $this->post('/login',['email'=>$identifier,'password'=>$password])->assertSessionHasErrors('email');
            $this->assertGuest();
        }
    }
    public function test_email_login_works_without_a_username_and_registration_requires_email(): void {
        $user=User::factory()->create(['password'=>'password123']);
        $this->post('/login',['email'=>$user->email,'password'=>'password123'])->assertRedirect('/');
        $this->assertAuthenticatedAs($user);
        $this->post('/logout');
        $this->post('/register',['name'=>'Alex','email'=>'just_username','password'=>'password123'])->assertSessionHasErrors('email');
    }
}
