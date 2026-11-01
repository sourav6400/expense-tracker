import React, {useEffect,useState} from 'react';
import {Link,useForm,usePage} from '@inertiajs/react';
import {ArrowLeft,Camera,Check,Eye,EyeOff,LockKeyhole,UserRound} from 'lucide-react';
import Notification from '../Components/Notification';

export default function Profile(){
 const {auth,flash}=usePage().props;
 const user=auth.user;
 const profile=useForm({name:user.name,username:user.username||'',photo:null});
 const password=useForm({current_password:'',password:'',password_confirmation:''});
 const [preview,setPreview]=useState(null),[showPasswords,setShowPasswords]=useState(false);
 useEffect(()=>{
  if(!profile.data.photo){setPreview(null);return;}
  const url=URL.createObjectURL(profile.data.photo);setPreview(url);
  return ()=>URL.revokeObjectURL(url);
 },[profile.data.photo]);
 return <div className="profile-page">
  <header className="profile-page-header"><Link href="/" className="brand"><span className="brand-icon">L</span>ledger<span className="brand-dot">.</span></Link><Link href="/" className="secondary"><ArrowLeft size={16}/> Back to workspace</Link></header>
  <div className="profile-page-content"><div className="eyebrow">YOUR PERSONAL SPACE</div><h1>Your profile</h1><p className="muted">Make it yours. Keep your account secure.</p>
   <Notification message={flash.success} resetKey={flash}/>
   <div className="profile-settings-grid"><section className="panel profile-settings"><div className="profile-section-title"><UserRound size={20}/><div><h2>Personal details</h2><p>Your photo and the name people know you by.</p></div></div>
    <form onSubmit={e=>{e.preventDefault();profile.post('/profile',{forceFormData:true,preserveScroll:true,onSuccess:()=>profile.setData('photo',null)});}}>
     <div className="photo-upload"><div className="large-avatar">{preview||user.profile_photo_url?<img src={preview||user.profile_photo_url} alt="Profile preview"/>:user.name[0]}</div><div><label className="secondary photo-picker"><Camera size={16}/> Choose photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>profile.setData('photo',e.target.files?.[0]||null)}/></label><p className="muted small">JPG, PNG or WebP. Up to 2 MB.</p></div></div>
     <label>Display name<input required maxLength={100} autoComplete="name" value={profile.data.name} onChange={e=>profile.setData('name',e.target.value)}/></label>
     <label>Username<input required minLength={3} maxLength={30} pattern="[A-Za-z0-9_]+" autoComplete="username" value={profile.data.username} onChange={e=>profile.setData('username',e.target.value)}/></label><p className="muted small">Unique to you. Use 3–30 letters, numbers or underscores. Usernames are saved in lowercase.</p>
     <Notification type="error" message={Object.values(profile.errors).join(' ')} resetKey={profile.errors}/>
     <button className="primary" disabled={profile.processing}><Check size={16}/>{profile.processing?'Saving...':'Save profile'}</button>
    </form>
   </section><section className="panel profile-settings"><div className="profile-section-title"><LockKeyhole size={20}/><div><h2>Change password</h2><p>A fresh password for peace of mind.</p></div></div>
    <form onSubmit={e=>{e.preventDefault();password.put('/profile/password',{preserveScroll:true,onSuccess:()=>password.reset(),onError:()=>password.reset()});}}>
     {[['current_password','Current password','current-password'],['password','New password','new-password'],['password_confirmation','Confirm new password','new-password']].map(([name,label,autoComplete])=><label key={name}>{label}<input required type={showPasswords?'text':'password'} autoComplete={autoComplete} minLength={name==='current_password'?undefined:8} maxLength={255} value={password.data[name]} onChange={e=>password.setData(name,e.target.value)}/></label>)}
     <button type="button" className="text-button" aria-pressed={showPasswords} onClick={()=>setShowPasswords(!showPasswords)}>{showPasswords?<EyeOff size={16}/>:<Eye size={16}/>} {showPasswords?'Hide passwords':'Show passwords'}</button>
     <p className="muted small">Use at least 8 characters and choose a different password from your current one.</p>
     <Notification type="error" message={Object.values(password.errors).join(' ')} resetKey={password.errors}/>
     <button className="primary" disabled={password.processing}><LockKeyhole size={16}/>{password.processing?'Updating...':'Update password'}</button>
    </form>
   </section></div>
  </div>
 </div>;
}
