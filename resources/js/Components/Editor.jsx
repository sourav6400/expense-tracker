import React,{useEffect,useRef,useState} from 'react';
import {useForm} from '@inertiajs/react';
import {ArrowLeft,Check,X} from 'lucide-react';
import {observeVisualViewport} from '../viewport';
import {accountBalance} from '../finance';
import Select from './Select';
import DateField from './DateField';
import Notification from './Notification';
const money=n=>'\u09f3'+(n/100).toLocaleString('en-BD',{maximumFractionDigits:2});
export default function Editor({modal,close,accounts,categories,transactions,month,pageLayout=false,returnUrl='/'}) {
 const {resource,type,item}=modal; const dialogRef=useRef(null);
 useEffect(()=>{
  if(pageLayout)return;
  const backdrop=dialogRef.current.parentElement;
  const scrollY=window.scrollY;
  const previous={overflow:document.body.style.overflow,position:document.body.style.position,top:document.body.style.top,width:document.body.style.width};
  Object.assign(document.body.style,{overflow:'hidden',position:'fixed',top:-scrollY+'px',width:'100%'});
  const stop=observeVisualViewport(({height,top})=>{
   backdrop.style.height=height+'px';
   backdrop.style.top=top+'px';
   backdrop.classList.toggle('modal-compact',height<500);
   const scroller=dialogRef.current?.querySelector('.modal-fields');
   const focused=document.activeElement;
   if(!scroller?.contains(focused))return;
   // Include the label, and measure after the keyboard-sized grid has laid out.
   const field=focused.closest('label,.form-field')||focused;
   const bounds=scroller.getBoundingClientRect(),rect=field.getBoundingClientRect();
   const delta=rect.height>bounds.height-24?rect.top-bounds.top-12:
    rect.bottom>bounds.bottom-12?rect.bottom-bounds.bottom+12:
    rect.top<bounds.top+12?rect.top-bounds.top-12:0;
   scroller.scrollTop+=delta;
  });
  return()=>{stop();Object.assign(document.body.style,previous);window.scrollTo(0,scrollY)};
 },[]);
 useEffect(()=>{if(pageLayout)return;const previous=document.activeElement;dialogRef.current?.querySelector('button')?.focus({preventScroll:true});const handler=e=>{if(e.key==='Escape'&&!e.defaultPrevented)close();if(e.key==='Tab'){const fields=[...dialogRef.current.querySelectorAll('button,input,select')].filter(el=>!el.disabled&&el.tabIndex>=0);const first=fields[0],last=fields.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}};document.addEventListener('keydown',handler);return()=>{document.removeEventListener('keydown',handler);previous?.focus({preventScroll:true})}},[]);const initial=resource==='transactions'?{title:'',amount:'',type,date:new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Dhaka'}),account_id:accounts[0]?.id||'',destination_id:'',category_id:categories[0]?.id||'',notes:''}:resource==='accounts'?{name:'',type:'Bank',opening_balance:0}:resource==='categories'?{name:'',color:'#28765c'}:{category_id:categories[0]?.id||'',amount:'',month};
 const [addingAccountType,setAddingAccountType]=useState(false);
 const accountTypes=[...new Set(['Cash','Bank','bKash','Nagad','Credit card','Savings',...accounts.map(a=>a.type)])];
 const form=useForm(item?{...initial,...item,...('amount'in item?{amount:item.amount/100}:{}),...('opening_balance'in item?{opening_balance:item.opening_balance/100}:{})}:initial);
 const field=(name,label,type='text')=>{if(['date','month'].includes(type))return <div className="form-field"><span>{label}</span><DateField aria-label={label} type={type} max={name==='date'?new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Dhaka'}):undefined} value={form.data[name]??''} onChange={e=>form.setData(name,e.target.value)}/></div>;const Input='input';return <label>{label}<Input required={!['notes'].includes(name)} type={type} max={name==='date'?new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Dhaka'}):undefined} inputMode={type==='number'?'decimal':undefined} step={type==='number'?'0.01':undefined} min={type==='number'?(name==='opening_balance'?0:0.01):undefined} value={form.data[name]??''} onChange={e=>form.setData(name,e.target.value)}/></label>};
 const select=(name,label,options)=><label>{label}<Select aria-label={label} required value={form.data[name]??''} onChange={e=>form.setData(name,e.target.value)}><option value="" disabled>Select {label.toLowerCase()}</option>{options.map(o=><option key={o.id??o} value={o.id??o}>{o.name??o}</option>)}</Select></label>;
 const Heading=pageLayout?'h1':'h2';
 const saveUrl='/finance/'+resource+(item?'/'+item.id:'')+(pageLayout?'?editor_page=1&'+new URLSearchParams(returnUrl.split('?')[1]):'');
 return <div className={pageLayout?'editor-page-shell':'modal-backdrop'} onClick={e=>!pageLayout&&e.target===e.currentTarget&&close()}><section ref={dialogRef} className={pageLayout?"modal editor-page-card":"modal"} role={pageLayout?undefined:"dialog"} aria-modal={pageLayout?undefined:"true"} aria-labelledby="editor-title"><div className="spread">{pageLayout&&<button type="button" className="editor-back secondary" onClick={close}><ArrowLeft size={18}/> Back</button>}<div><div className="eyebrow">A LITTLE MORE CLARITY</div><Heading id="editor-title">{item?'Edit':'Add'} {resource==='transactions'?'transaction':resource.slice(0,-1)}</Heading></div>{!pageLayout&&<button className="icon-button" aria-label="Close" onClick={close}><X/></button>}</div><form onSubmit={e=>{e.preventDefault();form.transform(data=>{const {id,user_id,created_at,updated_at,...clean}=data;if(resource==='accounts'&&item)delete clean.opening_balance;return clean});form[item?'put':'post'](saveUrl,{onSuccess:pageLayout?undefined:close})}}><div className="modal-fields">{resource==='transactions'&&<><div className="type-tabs">{['expense','income','transfer'].map(t=><button type="button" key={t} className={form.data.type===t?'selected':''} onClick={()=>form.setData('type',t)}>{t}</button>)}</div>{field('title','Title')}<div className="form-grid">{field('amount','Amount (BDT)','number')}{field('date','Transaction date','date')}</div>{select('account_id',form.data.type==='transfer'?'From account':'Account',accounts)}{form.data.type==='transfer'?select('destination_id','To account',accounts.filter(a=>String(a.id)!==String(form.data.account_id))):select('category_id','Category',categories)}{field('notes','Notes (optional)')}</>}{resource==='accounts'&&<>{field('name','Account name')}<label>Account type<Select aria-label="Account type" required value={addingAccountType?'__new_type__':form.data.type} onChange={e=>{const adding=e.target.value==='__new_type__';setAddingAccountType(adding);form.setData('type',adding?'':e.target.value)}}>{accountTypes.map(type=><option key={type} value={type}>{type}</option>)}<option value="__new_type__">+ Add account type</option></Select></label>{addingAccountType&&<label>New account type<input autoFocus required maxLength={100} placeholder="e.g. Mobile wallet" value={form.data.type} onChange={e=>form.setData('type',e.target.value)}/></label>}{item?<><label>Current balance (BDT)<input className="read-only-balance" type="text" readOnly value={money(accountBalance(item,transactions))}/></label><p className="muted small">Calculated from the opening balance and your transactions. This balance cannot be edited here.</p></>:<>{field('opening_balance','Opening balance (BDT)','number')}<p className="muted small">For credit cards, use a zero opening balance. Purchases are expenses; repayments are transfers.</p></>}</>}{resource==='categories'&&<>{field('name','Category name')}{field('color','Category color','color')}</>}{resource==='budgets'&&<>{select('category_id','Category',categories)}{field('amount','Monthly limit (BDT)','number')}{field('month','Budget month','month')}</>}<Notification type="error" message={Object.values(form.errors).join(" ")} resetKey={form.errors}/></div><div className="modal-actions"><button type="button" className="secondary" onClick={close}>Cancel</button><button disabled={form.processing} className="primary">{form.processing?'Saving…':'Save '+(resource==='transactions'?'transaction':resource.slice(0,-1))}<Check size={16}/></button></div></form></section></div>
}
