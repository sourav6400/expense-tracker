import React,{useState} from 'react';
import {Link,useForm,usePage} from '@inertiajs/react';
import {ArrowLeft,Eye,EyeOff,LockKeyhole,Mail} from 'lucide-react';
import Notification from '../Components/Notification';

export default function PasswordRecovery({mode,token='',email=''}){
 const reset=mode==='reset';
 const {flash}=usePage().props;
 const form=useForm({email,token,password:'',password_confirmation:''});
 const [visible,setVisible]=useState(false);
 return <div className="recovery-page"><section className="recovery-card">
  <Link href="/login" className="brand"><span className="brand-icon">L</span>ledger<span className="brand-dot">.</span></Link>
  <span className="recovery-icon">{reset?<LockKeyhole size={25}/>:<Mail size={25}/>}</span>
  <h1>{reset?'Choose a new password':'Forgot your password?'}</h1>
  <p className="muted">{reset?'Set a new password to get back to your workspace.':'Enter your account email and we will send you a link to reset your password.'}</p>
  <Notification message={flash.success} resetKey={flash}/>
  <form onSubmit={e=>{e.preventDefault();if(form.processing)return;form.post(reset?'/reset-password':'/forgot-password',{onFinish:()=>form.reset('password','password_confirmation')});}}>
   <label>Email address<input type="email" required maxLength={255} autoComplete="email" value={form.data.email} onChange={e=>form.setData('email',e.target.value)}/></label>
   {reset&&<>{[['password','New password'],['password_confirmation','Confirm new password']].map(([name,label])=><label key={name}>{label}<input type={visible?'text':'password'} autoComplete="new-password" required minLength={8} maxLength={255} value={form.data[name]} onChange={e=>form.setData(name,e.target.value)}/></label>)}<button type="button" className="text-button" aria-pressed={visible} onClick={()=>setVisible(!visible)}>{visible?<EyeOff size={16}/>:<Eye size={16}/>} {visible?'Hide passwords':'Show passwords'}</button><p className="muted small">Use at least 8 characters.</p></>}
   <Notification type="error" message={Object.values(form.errors).join(' ')} resetKey={form.errors}/>
   <button className="primary full" disabled={form.processing}>{form.processing?'Please wait...':reset?'Reset password':'Send reset link'}</button>
  </form>
  {reset&&<Link href="/forgot-password" className="text-button recovery-new-link">Request a new reset link</Link>}
  <Link href="/login" className="text-button recovery-back"><ArrowLeft size={15}/>Back to sign in</Link>
 </section></div>;
}
