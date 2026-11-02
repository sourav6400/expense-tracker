import React, {useEffect, useRef} from 'react';
import {AlertTriangle, LogOut, Trash2, X} from 'lucide-react';

export default function AlertDialog({title,message,onClose,onConfirm,processing=false,confirmLabel='Delete',processingLabel='Deleting...',variant='danger'}) {
 const ref=useRef(null);
 const ActionIcon=variant==='logout'?LogOut:Trash2;
 useEffect(()=>{
  const previous=document.activeElement;
  const overflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  ref.current.showModal();
  return ()=>{document.body.style.overflow=overflow;previous?.focus({preventScroll:true});};
 },[]);
 const close=()=>{if(!processing)onClose();};
 return <dialog ref={ref} className="alert-dialog" aria-labelledby="alert-title" aria-describedby="alert-message" onCancel={e=>{e.preventDefault();close();}} onClick={e=>{if(e.target===e.currentTarget){const rect=ref.current.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)close();}}}>
  <div className="alert-dialog-top"><span className={'alert-symbol '+(onConfirm?(variant==='logout'?'logout':'destructive'):'warning')}>{onConfirm?<ActionIcon size={24}/>:<AlertTriangle size={24}/>}</span><button type="button" className="icon-button" disabled={processing} aria-label="Close alert" onClick={close}><X size={19}/></button></div>
  <h2 id="alert-title">{title}</h2>
  <p id="alert-message">{message}</p>
  <div className="alert-dialog-actions">
   <button type="button" className={onConfirm?'secondary':'primary'} autoFocus disabled={processing} onClick={close}>{onConfirm?'Cancel':'Got it'}</button>
   {onConfirm&&<button type="button" className={variant==='logout'?'primary':'danger-button'} disabled={processing} onClick={onConfirm}><ActionIcon size={16}/>{processing?processingLabel:confirmLabel}</button>}
  </div>
 </dialog>;
}
