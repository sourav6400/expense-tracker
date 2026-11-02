import React, {useId, useRef, useState, useEffect} from 'react';
import {CalendarDays, ChevronLeft, ChevronRight, X} from 'lucide-react';

const months=Array.from({length:12},(_,i)=>new Date(2020,i,1).toLocaleDateString('en-GB',{month:'long'}));
const key=(year,month,day)=>`${year}-${String(month+1).padStart(2,'0')}${day?'-'+String(day).padStart(2,'0'):''}`;

export default function DateField({className='',type='date',value,onChange,max,min,'aria-label':label}) {
 const [open,setOpen]=useState(false), [view,setView]=useState(value?.slice(0,7)||key(new Date().getFullYear(),new Date().getMonth()));
 const root=useRef(null),trigger=useRef(null),id=useId();
 const [year,month]=view.split('-').map(Number), index=month-1;
 const allowed=v=>(!min||v>=min)&&(!max||v<=max);
 const choose=v=>{onChange({target:{value:v}});setOpen(false);trigger.current?.focus({preventScroll:true});};
 useEffect(()=>{
  if(!open)return;
  const dismiss=e=>{if(!root.current?.contains(e.target))setOpen(false);};
  document.addEventListener('pointerdown',dismiss);
  return()=>document.removeEventListener('pointerdown',dismiss);
 },[open]);
 const shift=n=>{const d=new Date(year,index+n,1);setView(key(d.getFullYear(),d.getMonth()));};
 const display=value?new Date(value+(type==='month'?'-01T12:00:00':'T12:00:00')).toLocaleDateString('en-GB',type==='month'?{month:'long',year:'numeric'}:{day:'numeric',month:'short',year:'numeric'}):'Choose '+(type==='month'?'month':'date');
 return <div ref={root} className={'date-field '+className} onKeyDown={e=>{if(open&&e.key==='Escape'){e.stopPropagation();setOpen(false);trigger.current?.focus({preventScroll:true});}}}>
  <button ref={trigger} type="button" className="date-trigger" aria-label={label?`${label}: ${display}`:undefined} aria-expanded={open} aria-controls={id} onClick={()=>{if(!open)setView(value?.slice(0,7)||view);setOpen(!open);}}><span>{display}</span><CalendarDays size={18} aria-hidden="true"/></button>
  {open&&<section id={id} className="calendar-panel" aria-label={type==='month'?'Choose month':'Choose date'}>
   <div className="calendar-heading"><button type="button" aria-label={type==='month'?'Previous year':'Previous month'} onClick={()=>type==='month'?setView(key(year-1,index)):shift(-1)}><ChevronLeft size={18}/></button><strong aria-live="polite">{type==='month'?year:`${months[index]} ${year}`}</strong><button type="button" aria-label={type==='month'?'Next year':'Next month'} onClick={()=>type==='month'?setView(key(year+1,index)):shift(1)}><ChevronRight size={18}/></button><button type="button" aria-label="Close calendar" onClick={()=>{setOpen(false);trigger.current?.focus({preventScroll:true});}}><X size={18}/></button></div>
   {type==='month'?<div className="calendar-months">{months.map((m,i)=>{const v=key(year,i);return <button type="button" key={m} disabled={!allowed(v)} aria-pressed={value===v} onClick={()=>choose(v)}>{m.slice(0,3)}</button>;})}</div>:<div className="calendar-days">
    {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d=><span key={d} className="calendar-weekday">{d}</span>)}
    {Array.from({length:new Date(year,index,1).getDay()},(_,i)=><span key={'blank'+i}/>)}
    {Array.from({length:new Date(year,index+1,0).getDate()},(_,i)=>{const v=key(year,index,i+1);return <button type="button" key={v} aria-label={new Date(year,index,i+1).toLocaleDateString('en-GB',{dateStyle:'full'})} aria-pressed={value===v} disabled={!allowed(v)} onClick={()=>choose(v)}>{i+1}</button>;})}
   </div>}
  </section>}
 </div>;
}
