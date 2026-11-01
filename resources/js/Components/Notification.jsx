import React, {useEffect, useState} from 'react';
import {AlertTriangle, Check, X} from 'lucide-react';

export default function Notification({message, type='success', resetKey}) {
 const [visible,setVisible]=useState(Boolean(message));
 useEffect(()=>{
  setVisible(Boolean(message));
  if(!message)return;
  const timer=window.setTimeout(()=>setVisible(false),5000);
  return ()=>window.clearTimeout(timer);
 },[message,resetKey]);
 if(!message||!visible)return null;
 return <div className={type==='success'?'success notification':'error notification'} role={type==='success'?'status':'alert'}>
  {type==='success'?<Check size={16}/>:<AlertTriangle size={18}/>}
  <span>{message}</span>
  <button type="button" className="icon-button" aria-label="Dismiss notification" onClick={()=>setVisible(false)}><X size={16}/></button>
 </div>;
}
