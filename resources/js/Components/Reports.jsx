import TransactionFilters from './TransactionFilters';
import React,{useState} from 'react';
import {ChartPie,Download,Tags,Wallet} from 'lucide-react';
import {accountTransactions,reportTransactions} from '../reports';
const money=n=>'৳'+(n/100).toLocaleString('en-BD',{maximumFractionDigits:2});

export default function Reports({accounts,categories,transactions,month}){
 const [accountId,setAccountId]=useState('all'),[selected,setSelected]=useState([]),[type,setType]=useState('all');
 const activeAccount=accounts.some(a=>String(a.id)===accountId)?accountId:'all';
 const relatedIds=new Set(accountTransactions(transactions,activeAccount).map(t=>String(t.category_id)));
 const related=categories.filter(c=>relatedIds.has(String(c.id)));
 const categoryIds=selected.filter(id=>relatedIds.has(id));
 const rows=reportTransactions(transactions,month,activeAccount,categoryIds,type);
 const income=rows.filter(t=>t.type==='income').reduce((sum,t)=>sum+t.amount,0);
 const expense=rows.filter(t=>t.type==='expense').reduce((sum,t)=>sum+t.amount,0);
 const summary=related.filter(c=>!categoryIds.length||categoryIds.includes(String(c.id))).map(c=>{
  const items=rows.filter(t=>String(t.category_id)===String(c.id));
  return {...c,count:items.length,income:items.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0),expense:items.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0)};
 }).filter(c=>c.count);
 const accountName=id=>accounts.find(a=>String(a.id)===String(id))?.name||'';
 const categoryName=id=>categories.find(c=>String(c.id)===String(id))?.name||'';
 const exportCsv=()=>{
  const cell=value=>'"'+String(/^[=+@\-\t\r]/.test(String(value))?"'"+value:value).replaceAll('"','""')+'"';
  const data=[['Date','Title','Type','Amount (BDT)','Account','Destination','Category','Notes'],...rows.map(t=>[t.date,t.title,t.type,(t.amount/100).toFixed(2),accountName(t.account_id),accountName(t.destination_id),categoryName(t.category_id),t.notes||''])];
  const url=URL.createObjectURL(new Blob(['\uFEFF'+data.map(row=>row.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8;'}));
  const link=document.createElement('a');link.href=url;link.download=`ledger-report-${month}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 return <div className="reports-view">
  <section className="panel report-filters"><div className="panel-heading"><div><h3>Build your report</h3><p>Choose an account and the categories you want to explore.</p></div><ChartPie size={20}/></div>
   <label className="report-account"><span><Wallet size={16}/> Account</span><select value={activeAccount} onChange={e=>{setAccountId(e.target.value);setSelected([]);}}><option value="all">All accounts</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
   <div className="report-category-heading"><span><Tags size={16}/> Related categories</span><button className="text-button" onClick={()=>setSelected([])}>All categories</button></div>
   <div className="report-category-options">{related.map(c=><label key={c.id} className={categoryIds.includes(String(c.id))?'selected':''}><input type="checkbox" checked={categoryIds.includes(String(c.id))} onChange={e=>setSelected(e.target.checked?[...categoryIds,String(c.id)]:categoryIds.filter(id=>id!==String(c.id)))}/>{c.name}</label>)}</div>
   <p className="muted small">{related.length?'Leave categories unchecked to include all categories and transfers. Select categories to focus on income and expenses.':'No categorized transactions for this account yet.'}</p>
  </section>
  <div className="stats report-stats">{[['Income',income],['Expenses',expense],['Net income',income-expense]].map(([label,value])=><article className="stat" key={label}><span>{label}</span><h2>{money(value)}</h2><p className="muted small">Selected month and filters</p></article>)}</div>
  <section className="panel"><div className="panel-heading"><div><h3>Category summary</h3><p>Transfers are excluded from income, expenses and net income.</p></div></div><div className="table-wrap"><table><thead><tr><th>CATEGORY</th><th>TRANSACTIONS</th><th className="right">INCOME</th><th className="right">EXPENSES</th><th className="right">NET</th></tr></thead><tbody>{summary.map(c=><tr key={c.id}><td><strong>{c.name}</strong></td><td>{c.count}</td><td className="right positive">{money(c.income)}</td><td className="right">{money(c.expense)}</td><td className="right">{money(c.income-c.expense)}</td></tr>)}</tbody></table>{!summary.length&&<div className="empty compact"><Tags/><h3>No category activity</h3><p>Try another month, account or category.</p></div>}</div></section>
  <section className="panel"><div className="panel-heading"><div><h3>Report transactions</h3><p>{rows.length} matching transaction{rows.length===1?'':'s'} · {month}</p></div><button className="secondary" disabled={!rows.length} onClick={exportCsv}><Download size={15}/> Export report</button></div><TransactionFilters accounts={accounts} categories={related} accountId={activeAccount} categoryId={categoryIds.length>1?'selected':categoryIds[0]||'all'} type={type} onAccountChange={value=>{setAccountId(value);setSelected([]);}} onCategoryChange={value=>{if(value!=='selected')setSelected(value==='all'?[]:[value]);}} onTypeChange={setType}/><div className="table-wrap"><table><thead><tr><th>DATE</th><th>TRANSACTION</th><th>ACCOUNT</th><th>CATEGORY</th><th>TYPE</th><th className="right">AMOUNT</th></tr></thead><tbody>{rows.map(t=><tr key={t.id}><td>{t.date}</td><td><strong>{t.title}</strong></td><td>{accountName(t.account_id)}{t.type==='transfer'?' → '+accountName(t.destination_id):''}</td><td>{t.type==='transfer'?'Transfer':categoryName(t.category_id)}</td><td><span className="pill">{t.type}</span></td><td className="right">{money(t.amount)}</td></tr>)}</tbody></table>{!rows.length&&<div className="empty compact"><ChartPie/><h3>No matching transactions</h3><p>Try another month or adjust your filters.</p></div>}</div></section>
 </div>;
}
