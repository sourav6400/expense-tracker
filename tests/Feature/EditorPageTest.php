<?php
namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class EditorPageTest extends TestCase
{
    use RefreshDatabase;
    protected function setUp(): void { parent::setUp(); $this->withoutVite(); }

    public function test_editor_pages_require_login_and_support_all_resources(): void {
        $this->get('/finance/transactions/create')->assertRedirect('/login');
        $this->actingAs(User::factory()->create());
        foreach (['transactions','accounts','categories','budgets'] as $resource) {
            $this->get('/finance/'.$resource.'/create?section=Accounts&month=2026-01&type=transfer')
                ->assertOk()->assertInertia(fn (Assert $page) => $page->component('EditorPage')
                    ->where('modal.resource',$resource)->where('modal.type','transfer')->where('modal.item',null)
                    ->where('returnUrl','/?section=Accounts&month=2026-01'));
        }
        $this->get('/finance/users/create')->assertNotFound();
    }

    public function test_edit_page_only_exposes_the_signed_in_users_records(): void {
        $user=User::factory()->create();$other=User::factory()->create();
        $own=DB::table('accounts')->insertGetId(['user_id'=>$user->id,'name'=>'Own wallet','type'=>'Cash','opening_balance'=>0]);
        $foreign=DB::table('accounts')->insertGetId(['user_id'=>$other->id,'name'=>'Private wallet','type'=>'Cash','opening_balance'=>0]);
        $this->actingAs($user)->get('/finance/accounts/'.$own.'/edit')->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('EditorPage')->where('modal.item.name','Own wallet')->has('accounts',1));
        $this->get('/finance/accounts/'.$foreign.'/edit')->assertNotFound();
        $this->get('/finance/accounts/99999/edit')->assertNotFound();
    }

    public function test_page_save_returns_to_workspace_and_validation_stays_on_form(): void {
        $this->actingAs(User::factory()->create());
        $url='/finance/categories/create?section=Categories&month=2026-01';
        $this->from($url)->post('/finance/categories?editor_page=1&section=Categories&month=2026-01',[])
            ->assertRedirect($url)->assertSessionHasErrors('name');
        $this->post('/finance/categories?editor_page=1&section=Categories&month=2026-01',['name'=>'Travel','color'=>'#26745c'])
            ->assertRedirect('/?section=Categories&month=2026-01')->assertSessionHas('success');
        $this->get('/?section=Categories&month=2026-01')->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')->where('workspaceSection','Categories')->where('selectedMonth','2026-01'));
        $id=DB::table('categories')->value('id');
        $this->put('/finance/categories/'.$id.'?editor_page=1&section=Categories&month=2026-01',['name'=>'Trips','color'=>'#26745c'])
            ->assertRedirect('/?section=Categories&month=2026-01');
        $this->assertDatabaseHas('categories',['id'=>$id,'name'=>'Trips']);
    }

    public function test_invalid_return_context_is_normalized_to_a_local_workspace(): void {
        $this->actingAs(User::factory()->create())->get('/finance/categories/create?section=https://example.com&month=invalid')
            ->assertInertia(fn (Assert $page) => $page->where('returnUrl','/?section=Overview&month='.now('Asia/Dhaka')->format('Y-m')));
    }
}
