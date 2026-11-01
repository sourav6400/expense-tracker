<?php
namespace Tests\Feature;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
class FinanceTest extends TestCase {
    use RefreshDatabase;
    protected function setUp(): void { parent::setUp(); $this->withoutVite(); $this->travelTo(\Illuminate\Support\Carbon::parse('2026-10-28 12:00:00', 'Asia/Dhaka')); }
    private function account(int $user, string $name = 'Bank'): int { return DB::table('accounts')->insertGetId(['user_id'=>$user,'name'=>$name,'type'=>'Bank','opening_balance'=>100000]); }
    public function test_guests_must_sign_in(): void { $this->get('/')->assertRedirect('/login'); $this->get('/login')->assertOk(); }
    public function test_export_applies_date_range_and_transaction_filters(): void {
        $user=User::factory()->create();$other=User::factory()->create();
        $a=$this->account($user->id);$b=$this->account($user->id,'Wallet');$foreign=$this->account($other->id);
        $category=DB::table('categories')->insertGetId(['user_id'=>$user->id,'name'=>'Food']);
        foreach ([['First day','2026-09-30',$a],['Last day','2026-10-02',$a],['Outside range','2026-10-03',$a],['Other account','2026-10-01',$b]] as [$title,$date,$account]) {
            DB::table('transactions')->insert(['user_id'=>$user->id,'account_id'=>$account,'category_id'=>$category,'title'=>$title,'date'=>$date,'type'=>'expense','amount'=>100]);
        }
        $this->actingAs($user);
        $url='/export?'.http_build_query(['from'=>'2026-09-30','to'=>'2026-10-02','account_id'=>$a,'category_id'=>$category,'type'=>'expense']);
        $csv=$this->get($url)->assertOk()->streamedContent();
        $this->assertStringContainsString('First day',$csv);$this->assertStringContainsString('Last day',$csv);
        $this->assertStringNotContainsString('Outside range',$csv);$this->assertStringNotContainsString('Other account',$csv);
        $csv=$this->get($url.'&search=Last')->streamedContent();
        $this->assertStringContainsString('Last day',$csv);$this->assertStringNotContainsString('First day',$csv);
        $this->get('/export?from=2026-10-02&to=2026-09-30')->assertSessionHasErrors('to');
        $this->get('/export?account_id='.$foreign)->assertSessionHasErrors('account_id');
    }
    public function test_category_deletion_requires_ownership_and_no_linked_records(): void {
        $user=User::factory()->create();$other=User::factory()->create();
        $category=DB::table('categories')->insertGetId(['user_id'=>$user->id,'name'=>'Food']);
        $foreign=DB::table('categories')->insertGetId(['user_id'=>$other->id,'name'=>'Other food']);
        $this->delete('/categories/'.$category)->assertRedirect('/login');
        $this->actingAs($user)->delete('/categories/'.$foreign)->assertNotFound();
        $account=$this->account($user->id);
        $transaction=DB::table('transactions')->insertGetId(['user_id'=>$user->id,'account_id'=>$account,'category_id'=>$category,'title'=>'Food','type'=>'expense','amount'=>100,'date'=>'2026-01-01']);
        $this->delete('/categories/'.$category)->assertSessionHasErrors('category');
        $this->assertDatabaseHas('transactions',['id'=>$transaction,'category_id'=>$category]);
        $this->assertDatabaseHas('categories',['id'=>$category]);
        DB::table('transactions')->where('id',$transaction)->delete();
        $budget=DB::table('budgets')->insertGetId(['user_id'=>$user->id,'category_id'=>$category,'amount'=>10000,'month'=>'2026-01']);
        $this->delete('/categories/'.$category)->assertSessionHasErrors('category');
        $this->assertDatabaseHas('budgets',['id'=>$budget,'category_id'=>$category]);
        DB::table('budgets')->where('id',$budget)->delete();
        $this->delete('/categories/'.$category)->assertSessionHasNoErrors()->assertSessionHas('success','Category deleted.');
        $this->assertDatabaseMissing('categories',['id'=>$category]);
        $this->assertDatabaseHas('categories',['id'=>$foreign]);
        $this->delete('/categories/'.$category)->assertNotFound();
    }
    public function test_account_updates_cannot_change_opening_balance(): void {
        $user=User::factory()->create();$id=$this->account($user->id);
        $this->actingAs($user)->put('/finance/accounts/'.$id,['name'=>'Renamed bank','type'=>'Savings','opening_balance'=>999999,'current_balance'=>999999])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('accounts',['id'=>$id,'name'=>'Renamed bank','type'=>'Savings','opening_balance'=>100000]);
        $this->put('/finance/accounts/'.$id,['name'=>'New name','type'=>'Bank'])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('accounts',['id'=>$id,'name'=>'New name','opening_balance'=>100000]);
        $this->post('/finance/accounts',['name'=>'New account','type'=>'Bank','opening_balance'=>'12.35'])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('accounts',['name'=>'New account','opening_balance'=>1235]);
    }
    public function test_custom_account_types_can_be_created_and_updated(): void {
        $u=User::factory()->create(); $this->actingAs($u);
        $payload=['name'=>'Travel wallet','type'=>'Mobile wallet','opening_balance'=>0];
        $this->post('/finance/accounts',$payload)->assertSessionHasNoErrors();
        $id=DB::table('accounts')->where('user_id',$u->id)->value('id');
        $this->assertDatabaseHas('accounts',['id'=>$id,'type'=>'Mobile wallet']);
        $this->put('/finance/accounts/'.$id,[...$payload,'type'=>'Investment'])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('accounts',['id'=>$id,'type'=>'Investment']);
        foreach (['', '   ', str_repeat('a',101)] as $type) {
            $this->post('/finance/accounts',[...$payload,'type'=>$type])->assertSessionHasErrors('type');
        }
        $this->assertDatabaseCount('accounts',1);
    }
    public function test_only_owner_can_delete_an_unused_account(): void {
        $u=User::factory()->create(); $other=User::factory()->create();
        $a=$this->account($u->id); $b=$this->account($other->id);
        $this->delete('/accounts/'.$a)->assertRedirect('/login');
        $this->actingAs($u)->delete('/accounts/'.$b)->assertNotFound();
        $this->delete('/accounts/'.$a)->assertRedirect()->assertSessionHas('success','Account deleted.');
        $this->assertDatabaseMissing('accounts',['id'=>$a]);
        $this->assertDatabaseHas('accounts',['id'=>$b]);
    }
    public function test_account_deletion_requires_removing_or_reassigning_all_related_records(): void {
        $u=User::factory()->create(); $a=$this->account($u->id); $b=$this->account($u->id,'Wallet'); $c=$this->account($u->id,'Savings');
        $this->actingAs($u);
        $id=DB::table('transactions')->insertGetId(['user_id'=>$u->id,'account_id'=>$a,'destination_id'=>$b,'type'=>'transfer','title'=>'Transfer','amount'=>100,'date'=>'2026-10-28']);
        foreach ([$a,$b] as $account) {
            $this->delete('/accounts/'.$account)->assertRedirect()->assertSessionHasErrors('account');
            $this->assertDatabaseHas('accounts',['id'=>$account]);
        }
        $this->assertDatabaseHas('transactions',['id'=>$id,'account_id'=>$a,'destination_id'=>$b]);
        $this->put('/finance/transactions/'.$id,['title'=>'Transfer','type'=>'transfer','amount'=>1,'date'=>'2026-10-28','account_id'=>$c,'destination_id'=>$b])->assertSessionHasNoErrors();
        $this->delete('/accounts/'.$a)->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('accounts',['id'=>$a]);
        $this->delete('/transactions/'.$id)->assertRedirect();
        $this->delete('/accounts/'.$b)->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('accounts',['id'=>$b]);
    }
    public function test_registration_creates_private_workspace(): void {
        $this->post('/register',['name'=>'Alex','username'=>'alex_123','email'=>'alex@example.test','password'=>'password123'])->assertRedirect('/');
        $this->assertAuthenticated(); $this->assertDatabaseCount('accounts',1); $this->assertDatabaseCount('categories',9);
        $this->get('/')->assertOk();
    }
    public function test_transaction_round_trip_and_decimal_precision(): void {
        $u=User::factory()->create(); $a=$this->account($u->id); $c=DB::table('categories')->insertGetId(['user_id'=>$u->id,'name'=>'Food']);
        $payload=['title'=>'Lunch','type'=>'expense','amount'=>'12.35','date'=>'2026-10-28','account_id'=>$a,'category_id'=>$c];
        $this->actingAs($u)->post('/finance/transactions',$payload)->assertSessionHasNoErrors()->assertRedirect();
        $this->assertDatabaseHas('transactions',['amount'=>1235,'type'=>'expense']);
        $id=DB::table('transactions')->value('id');
        $this->put('/finance/transactions/'.$id,[...$payload,'amount'=>'20.99'])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('transactions',['amount'=>2099]);
        $this->delete('/transactions/'.$id)->assertRedirect(); $this->assertDatabaseCount('transactions',0);
    }
    public function test_transfer_is_a_single_atomic_record_and_cannot_target_same_account(): void {
        $u=User::factory()->create();$a=$this->account($u->id);$b=$this->account($u->id,'bKash');
        $payload=['title'=>'Wallet top up','type'=>'transfer','amount'=>500,'date'=>'2026-10-28','account_id'=>$a,'destination_id'=>$b];
        $this->actingAs($u)->post('/finance/transactions',$payload)->assertSessionHasNoErrors();
        $this->assertDatabaseCount('transactions',1);$this->assertDatabaseHas('transactions',['type'=>'transfer','amount'=>50000,'account_id'=>$a,'destination_id'=>$b,'category_id'=>null]);
        $this->post('/finance/transactions',[...$payload,'destination_id'=>$a])->assertSessionHasErrors('destination_id');
    }
    public function test_user_cannot_reference_or_modify_another_users_data(): void {
        $u=User::factory()->create();$other=User::factory()->create();$a=$this->account($other->id);
        $this->actingAs($u)->post('/finance/transactions',['title'=>'Bad transfer','type'=>'transfer','amount'=>50,'date'=>'2026-10-28','account_id'=>$a,'destination_id'=>$a])->assertSessionHasErrors('account_id');
        $this->put('/finance/accounts/'.$a,['name'=>'Stolen','type'=>'Bank','opening_balance'=>0])->assertNotFound();
        $this->get('/')->assertInertia(fn ($page)=>$page->has('accounts',0)->has('transactions',0));
    }
    public function test_budget_upsert_and_csv_export(): void {
        $u=User::factory()->create();$a=$this->account($u->id);$c=DB::table('categories')->insertGetId(['user_id'=>$u->id,'name'=>'Food']);
        $this->actingAs($u)->post('/finance/budgets',['category_id'=>$c,'amount'=>100,'month'=>'2026-10'])->assertSessionHasNoErrors();
        $this->post('/finance/budgets',['category_id'=>$c,'amount'=>150,'month'=>'2026-10'])->assertSessionHasNoErrors();
        $this->assertDatabaseCount('budgets',1);$this->assertDatabaseHas('budgets',['amount'=>15000]);
        $this->post('/finance/transactions',['title'=>'=SUM(A1)','type'=>'expense','amount'=>12.35,'date'=>'2026-10-28','account_id'=>$a,'category_id'=>$c]);
        $response=$this->get('/export');$response->assertDownload('ledger-transactions.csv');$this->assertStringContainsString("'=SUM(A1)",$response->streamedContent());
    }
    public function test_transaction_dates_follow_bangladesh_today_on_create_and_update(): void {
        // Bangladesh has crossed midnight while UTC is still on the previous day.
        $this->travelTo(\Illuminate\Support\Carbon::parse('2026-10-28 18:30:00', 'UTC'));
        $u=User::factory()->create(); $a=$this->account($u->id); $b=$this->account($u->id,'Wallet');
        $c=DB::table('categories')->insertGetId(['user_id'=>$u->id,'name'=>'Food']);
        $this->actingAs($u);
        foreach (['expense','income','transfer'] as $type) {
            $payload=['title'=>'Date check','type'=>$type,'amount'=>10,'date'=>'2026-10-30','account_id'=>$a,'category_id'=>$c,'destination_id'=>$type==='transfer'?$b:null];
            $this->post('/finance/transactions',$payload)->assertSessionHasErrors('date');
            $this->assertDatabaseMissing('transactions',['type'=>$type]);
            foreach (['2026-10-28','2026-10-29'] as $date) {
                $this->post('/finance/transactions',[...$payload,'date'=>$date])->assertSessionHasNoErrors();
            }
            $id=DB::table('transactions')->where('type',$type)->orderByDesc('id')->value('id');
            $this->put('/finance/transactions/'.$id,$payload)->assertSessionHasErrors('date');
            $this->assertDatabaseHas('transactions',['id'=>$id,'date'=>'2026-10-29']);
            $this->put('/finance/transactions/'.$id,[...$payload,'date'=>'2026-10-28'])->assertSessionHasNoErrors();
        }
        $this->assertDatabaseCount('transactions',6);
    }
}
