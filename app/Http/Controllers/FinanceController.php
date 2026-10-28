<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Auth, DB, Hash};
use Illuminate\Validation\Rule;
use App\Models\User;
use Inertia\Inertia;
class FinanceController extends Controller
{
    public function auth(Request $r, string $mode = 'login') {
        $data = $r->validate(['email'=>['required','email'], 'password'=>['required','string','min:8'], 'name'=>[$mode === 'register' ? 'required' : 'nullable','string','max:100']]);
        if ($mode === 'register') {
            $r->validate(['email'=>'unique:users,email']);
            $user = DB::transaction(function () use ($data) {
                $user = User::create($data);
                foreach (['Food & groceries','Housing','Transportation','Shopping','Entertainment','Healthcare','Salary','Freelance','Other'] as $name) DB::table('categories')->insert(['user_id'=>$user->id,'name'=>$name,'color'=>'#28765c']);
                DB::table('accounts')->insert(['user_id'=>$user->id,'name'=>'Cash wallet','type'=>'Cash','opening_balance'=>0]);
                return $user;
            });
            Auth::login($user);
        } elseif (!Auth::attempt($r->only('email','password'))) {
            return back()->withErrors(['email'=>'The email or password is incorrect.']);
        }
        $r->session()->regenerate();
        return redirect('/');
    }
    public function index(Request $r) {
        $uid = $r->user()->id;
        return Inertia::render('Dashboard', ['accounts'=>DB::table('accounts')->where('user_id',$uid)->get(), 'categories'=>DB::table('categories')->where('user_id',$uid)->get(), 'transactions'=>DB::table('transactions')->where('user_id',$uid)->orderByDesc('date')->orderByDesc('id')->get(), 'budgets'=>DB::table('budgets')->where('user_id',$uid)->get()]);
    }
    public function save(Request $r, string $resource, ?int $id = null) {
        abort_unless(in_array($resource,['transactions','accounts','categories','budgets']),404);
        $uid = $r->user()->id;
        if ($id) abort_unless(DB::table($resource)->where(['id'=>$id,'user_id'=>$uid])->exists(),404);
        $owned = fn ($table) => Rule::exists($table,'id')->where('user_id',$uid);
        $rules = match ($resource) {
            'transactions'=>['title'=>'required|string|max:150','type'=>'required|in:income,expense,transfer','amount'=>'required|numeric|min:0.01|max:999999999','date'=>['required','date_format:Y-m-d','before_or_equal:'.now('Asia/Dhaka')->toDateString()],'account_id'=>['required',$owned('accounts')],'destination_id'=>['nullable','required_if:type,transfer','different:account_id',$owned('accounts')],'category_id'=>['nullable','required_unless:type,transfer',$owned('categories')],'notes'=>'nullable|string|max:2000'],
            'accounts'=>['name'=>'required|string|max:100','type'=>'required|in:Cash,Bank,bKash,Nagad,Credit card,Savings','opening_balance'=>'required|numeric|min:0|max:999999999'],
            'categories'=>['name'=>'required|string|max:100','color'=>'required|regex:/^#[a-fA-F0-9]{6}$/'],
            'budgets'=>['category_id'=>['required',$owned('categories')],'amount'=>'required|numeric|min:0.01|max:999999999','month'=>'required|date_format:Y-m'],
        };
        $data=$r->validate($rules, ['date.before_or_equal'=>'Transaction date cannot be after today (Bangladesh time).']);
        foreach (['amount','opening_balance'] as $key) if (isset($data[$key])) $data[$key]=(int) round($data[$key]*100);
        if ($resource==='transactions') {
            if ($data['type']!=='transfer') $data['destination_id']=null;
            else $data['category_id']=null;
        }
        $data['updated_at']=now();
        if ($resource==='budgets' && !$id) DB::table($resource)->updateOrInsert(['user_id'=>$uid,'category_id'=>$data['category_id'],'month'=>$data['month']],$data);
        elseif ($id) DB::table($resource)->where(['id'=>$id,'user_id'=>$uid])->update($data);
        else DB::table($resource)->insert([...$data,'user_id'=>$uid,'created_at'=>now()]);
        return back()->with('success','Saved successfully.');
    }
    public function destroy(Request $r, int $id) {
        $deleted=DB::table('transactions')->where(['id'=>$id,'user_id'=>$r->user()->id])->delete();
        abort_unless($deleted,404);
        return back()->with('success','Transaction deleted.');
    }
    public function export(Request $r) {
        return response()->streamDownload(function () use ($r) {
            $out=fopen('php://output','w');
            fputcsv($out,['Date','Title','Type','Amount (BDT)','Account','Category','Notes']);
            $rows=DB::table('transactions as t')->join('accounts as a','a.id','=','t.account_id')->leftJoin('categories as c','c.id','=','t.category_id')->where('t.user_id',$r->user()->id)->select('t.*','a.name as account','c.name as category')->orderBy('date')->get();
            foreach ($rows as $t) {
                $safe=fn ($s) => preg_match('/^[=+@\-\t\r]/', (string)$s) ? "'".$s : $s;
                fputcsv($out,array_map($safe,[$t->date,$t->title,$t->type,number_format($t->amount/100,2,'.',''),$t->account,$t->category,$t->notes]));
            }
            fclose($out);
        },'ledger-transactions.csv',['Content-Type'=>'text/csv']);
    }
}
