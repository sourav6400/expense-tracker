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
    public function test_registration_creates_private_workspace(): void {
        $this->post('/register',['name'=>'Alex','email'=>'alex@example.test','password'=>'password123'])->assertRedirect('/');
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
