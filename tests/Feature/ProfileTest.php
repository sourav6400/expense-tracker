<?php
namespace Tests\Feature;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\{Hash,Storage};
use Tests\TestCase;

class ProfileTest extends TestCase {
    use RefreshDatabase;
    protected function setUp(): void { parent::setUp(); $this->withoutVite(); }
    public function test_profile_requires_authentication(): void {
        $this->get('/profile')->assertRedirect('/login');
        $this->post('/profile')->assertRedirect('/login');
        $this->put('/profile/password')->assertRedirect('/login');
        $this->get('/profile/photo')->assertRedirect('/login');
    }
    public function test_username_is_unique_normalized_and_editable(): void {
        $user=User::factory()->create(); $other=User::factory()->create();
        $other->forceFill(['username'=>'taken'])->save();
        $this->actingAs($user)->get('/profile')->assertOk();
        $this->post('/profile',['name'=>'Alex','username'=>'TAKEN'])->assertSessionHasErrors('username');
        $this->post('/profile',['name'=>'Alex','username'=>'Alex_123'])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('users',['id'=>$user->id,'username'=>'alex_123','name'=>'Alex']);
        $this->post('/profile',['name'=>'Alex updated','username'=>'alex_123'])->assertSessionHasNoErrors();
        foreach (['ab','bad name',str_repeat('a',31)] as $username) {
            $this->post('/profile',['name'=>'Alex','username'=>$username])->assertSessionHasErrors('username');
        }
        $this->assertDatabaseHas('users',['id'=>$other->id,'username'=>'taken']);
    }
    public function test_password_change_requires_current_password_and_confirmation(): void {
        $user=User::factory()->create(['password'=>'old-password']); $this->actingAs($user);
        $payload=['current_password'=>'wrong','password'=>'new-password','password_confirmation'=>'new-password'];
        $this->put('/profile/password',$payload)->assertSessionHasErrors('current_password');
        $this->put('/profile/password',[...$payload,'current_password'=>'old-password','password_confirmation'=>'mismatch'])->assertSessionHasErrors('password');
        $this->assertTrue(Hash::check('old-password',$user->fresh()->password));
        $this->put('/profile/password',[...$payload,'current_password'=>'old-password'])->assertSessionHasNoErrors();
        $this->assertTrue(Hash::check('new-password',$user->fresh()->password));
        $this->assertFalse(Hash::check('old-password',$user->fresh()->password));
    }
    public function test_photo_is_validated_replaced_and_private_to_its_owner(): void {
        Storage::fake('local'); $user=User::factory()->create();
        // A valid PNG without requiring the GD extension in the test environment.
        $png=base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=');
        $payload=['name'=>$user->name,'username'=>'photo_user'];
        $this->actingAs($user)->post('/profile',[...$payload,'photo'=>UploadedFile::fake()->createWithContent('avatar.png',$png)])->assertSessionHasNoErrors();
        $old=$user->fresh()->profile_photo_path; Storage::disk('local')->assertExists($old);
        $this->get('/profile/photo')->assertOk();
        $this->post('/profile',[...$payload,'photo'=>UploadedFile::fake()->createWithContent('next.png',$png)])->assertSessionHasNoErrors();
        Storage::disk('local')->assertMissing($old);
        $path=$user->fresh()->profile_photo_path; Storage::disk('local')->assertExists($path);
        $this->post('/profile',[...$payload,'photo'=>UploadedFile::fake()->create('bad.svg',10,'image/svg+xml')])->assertSessionHasErrors('photo');
        $this->post('/profile',[...$payload,'photo'=>UploadedFile::fake()->createWithContent('large.png',$png)->size(2049)])->assertSessionHasErrors('photo');
        $this->assertSame($path,$user->fresh()->profile_photo_path);
        $this->actingAs(User::factory()->create())->get('/profile/photo')->assertNotFound();
    }
}
