import React,{useEffect,useState} from 'react';
import {CheckCircle2,LoaderCircle,XCircle} from 'lucide-react';

export default function AvailabilityCheck({field,value,onStatusChange}){
 const normalized=value.trim();
 const valid=field==='username'?/^[a-zA-Z0-9_]{3,30}$/.test(normalized):normalized.length<=255&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
 const [result,setResult]=useState(null);
 const [attempt,setAttempt]=useState(0);
 useEffect(()=>{
  if(!valid)return;
  const controller=new AbortController();
  let active=true;
  const timer=setTimeout(async()=>{
   try{
    const response=await fetch('/register/availability?'+new URLSearchParams({field,value:normalized}),{signal:controller.signal,headers:{Accept:'application/json'}});
    if(!response.ok)throw new Error('Check failed');
    const data=await response.json();
    if(active)setResult({value:normalized,status:data.available?'available':'taken'});
   }catch(error){if(active&&error.name!=='AbortError')setResult({value:normalized,status:'error'});}
  },450);
  return ()=>{active=false;clearTimeout(timer);controller.abort();};
 },[field,normalized,valid,attempt]);
 const status=!normalized?'empty':!valid?'invalid':result?.value===normalized?result.status:'checking';
 useEffect(()=>{onStatusChange?.({value:normalized,status});},[normalized,status,onStatusChange]);
 if(!normalized)return null;
 const label=field==='username'?'Username':'Email';
 const text={available:`${label} is available`,taken:`${label} is already taken`,checking:'Checking availability...',error:'Unable to check availability.',invalid:field==='username'?'Use 3-30 letters, numbers or underscores.':'Enter a valid email address.'}[status];
 return <span className={'availability-check '+status} role="status" aria-live="polite">{status==='checking'?<LoaderCircle size={14} className="availability-spinner"/>:status==='available'?<CheckCircle2 size={14}/>:<XCircle size={14}/>} {text}{status==='error'&&<button type="button" className="text-button" onClick={()=>{setResult(null);setAttempt(n=>n+1);}}>Retry</button>}</span>;
}
