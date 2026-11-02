import React,{useEffect,useReducer,useRef,useState} from 'react';
import {Calculator as CalculatorIcon,Check,Copy,Delete,X} from 'lucide-react';
import {calculatorStep,initialCalculator} from '../calculator';

export default function Calculator({onClose}){
 const ref=useRef(null);
 const [state,dispatch]=useReducer(calculatorStep,initialCalculator);
 const [copyStatus,setCopyStatus]=useState('');
 const hasResult=state.fresh&&state.operator===null&&state.stored===null&&state.display!=='Error';
 useEffect(()=>{
  setCopyStatus('');
 },[state.display]);
 useEffect(()=>{
  if(!copyStatus)return;
  const timer=setTimeout(()=>setCopyStatus(''),2000);
  return ()=>clearTimeout(timer);
 },[copyStatus]);
 const copyResult=async()=>{
  try {
   await navigator.clipboard.writeText(state.display);
   setCopyStatus('Copied');
  } catch {
   setCopyStatus('Unable to copy. Select the result to copy it.');
  }
 };
 useEffect(()=>{
  const previous=document.activeElement,overflow=document.body.style.overflow;
  document.body.style.overflow='hidden';ref.current.showModal();
  return ()=>{document.body.style.overflow=overflow;previous?.focus({preventScroll:true});};
 },[]);
 const keys=[['AC','clear','Clear'],['+/−','sign','Change sign'],['%','%','Percent'],['÷','/','Divide'],['7','7'],['8','8'],['9','9'],['×','*','Multiply'],['4','4'],['5','5'],['6','6'],['−','-','Subtract'],['1','1'],['2','2'],['3','3'],['+','+','Add'],[<Delete size={18}/>,'back','Backspace'],['0','0'],['.','.','Decimal point'],['=','=','Equals']];
 return <dialog ref={ref} className="alert-dialog calculator-dialog" aria-labelledby="calculator-title" onCancel={e=>{e.preventDefault();onClose();}} onKeyDown={e=>{
  if(e.altKey||e.ctrlKey||e.metaKey)return;
  if(e.key==='Enter'&&e.target.closest('.calculator-copy,[aria-label="Close calculator"]'))return;
  const key=e.key==='Enter'?'=':e.key==='Backspace'?'back':e.key==='Delete'?'clear':e.key;
  if(/^[0-9.+*/%=-]$/.test(key)||['back','clear'].includes(key)){e.preventDefault();dispatch(key);}
 }}>
  <div className="spread calculator-heading"><h2 id="calculator-title"><CalculatorIcon size={20}/> Calculator</h2><button className="icon-button" aria-label="Close calculator" onClick={onClose}><X size={20}/></button></div>
  <div className="calculator-display"><span>{state.stored!==null?`${state.stored} ${{'+':'+','-':'−','*':'×','/':'÷'}[state.operator]}`:'Ready when you are'}</span><output aria-live="polite" aria-label="Result">{state.display==='Error'?'Cannot divide by zero':state.display}</output>{hasResult&&<div className="calculator-copy-row"><span role="status">{copyStatus}</span><button type="button" className="calculator-copy" aria-label="Copy result" disabled={state.display==='Error'} onClick={copyResult}>{copyStatus==='Copied'?<Check size={14}/>:<Copy size={14}/>}Copy</button></div>}</div>
  <div className="calculator-keys">{keys.map(([label,key,aria])=><button key={key} aria-label={aria||label} className={key==='='?'calculator-equals':['+','-','*','/'].includes(key)?'calculator-operator':''} onClick={()=>dispatch(key)}>{label}</button>)}</div>
  <p className="calculator-hint">Use your keyboard · Enter to calculate · Esc to close</p>
 </dialog>;
}
