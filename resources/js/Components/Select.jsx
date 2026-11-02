import React,{Children,useEffect,useId,useLayoutEffect,useRef,useState} from 'react';
import {Check,ChevronDown} from 'lucide-react';

export default function Select({value,onChange,children,required=false,disabled=false,'aria-label':label='Select option'}){
 const options=Children.toArray(children).flatMap(child=>Array.isArray(child)?child:[child]).filter(child=>child?.props).map(child=>({value:String(child.props.value),label:child.props.children,disabled:child.props.disabled}));
 const selected=options.findIndex(option=>option.value===String(value));
 const [open,setOpen]=useState(false),[active,setActive]=useState(0);
 const root=useRef(null),trigger=useRef(null),menu=useRef(null),search=useRef(''),searchTimer=useRef(null);
 const id=useId();
 const choose=index=>{const option=options[index];if(!option||option.disabled)return;onChange({target:{value:option.value}});setOpen(false);trigger.current?.focus({preventScroll:true});};
 useEffect(()=>()=>clearTimeout(searchTimer.current),[]);
 useLayoutEffect(()=>{
  if(!open)return;
  const node=menu.current;
  const position=()=>{
   const r=trigger.current.getBoundingClientRect(),viewport=window.visualViewport;
   const top=viewport?.offsetTop||0,left=viewport?.offsetLeft||0,width=viewport?.width||innerWidth,height=viewport?.height||innerHeight;
   if(r.bottom<top||r.top>top+height){setOpen(false);return;}
   const below=top+height-r.bottom-12,above=r.top-top-12,up=below<180&&above>below;
   const available=Math.max(0,Math.min(280,up?above:below));
   const menuWidth=Math.min(r.width,width-24);
   Object.assign(node.style,{width:menuWidth+'px',left:Math.max(left+12,Math.min(r.left,left+width-menuWidth-12))+'px',maxHeight:available+'px',top:(up?r.top-available-6:r.bottom+6)+'px',bottom:'auto'});
  };
  position();node.showPopover?.();
  const dismiss=e=>{if(!root.current?.contains(e.target))setOpen(false);};
  document.addEventListener('pointerdown',dismiss);
  window.addEventListener('resize',position);document.addEventListener('scroll',position,true);
  window.visualViewport?.addEventListener('resize',position);window.visualViewport?.addEventListener('scroll',position);
  return ()=>{node.hidePopover?.();document.removeEventListener('pointerdown',dismiss);window.removeEventListener('resize',position);document.removeEventListener('scroll',position,true);window.visualViewport?.removeEventListener('resize',position);window.visualViewport?.removeEventListener('scroll',position);};
 },[open]);
 useEffect(()=>{
  if(!open)return;
  const node=menu.current,option=node?.querySelector(`[data-index="${active}"]`);
  if(!option)return;
  const bounds=node.getBoundingClientRect(),rect=option.getBoundingClientRect();
  if(rect.bottom>bounds.bottom)node.scrollTop+=rect.bottom-bounds.bottom;
  else if(rect.top<bounds.top)node.scrollTop+=rect.top-bounds.top;
 },[active,open]);
 const begin=()=>{setActive(selected>=0&&!options[selected].disabled?selected:Math.max(0,options.findIndex(o=>!o.disabled)));setOpen(true);};
 const keyDown=e=>{
  if(e.key==='Escape'&&open){e.preventDefault();e.stopPropagation();setOpen(false);return;}
  if(e.key==='Tab'){setOpen(false);return;}
  if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){
   e.preventDefault();if(!open){begin();return;}
   const enabled=options.map((o,i)=>!o.disabled?i:-1).filter(i=>i>=0);
   const current=enabled.indexOf(active),delta=e.key==='ArrowUp'?-1:1;
   setActive(e.key==='Home'?enabled[0]:e.key==='End'?enabled.at(-1):enabled[(current+delta+enabled.length)%enabled.length]);return;
  }
  if(e.key==='Enter'||e.key===' '){e.preventDefault();open?choose(active):begin();return;}
  if(e.key.length===1&&!e.ctrlKey&&!e.metaKey){
   e.preventDefault();clearTimeout(searchTimer.current);search.current+=e.key.toLowerCase();
   const index=options.findIndex(o=>!o.disabled&&String(o.label).toLowerCase().startsWith(search.current));
   if(index>=0){if(!open)begin();setActive(index);}
   searchTimer.current=setTimeout(()=>{search.current='';},600);
  }
 };
 return <div ref={root} className="custom-select">
  <select className="select-validation" aria-hidden="true" tabIndex={-1} value={value} required={required} disabled={disabled} onChange={onChange} onInvalid={e=>{e.preventDefault();trigger.current?.focus({preventScroll:true});begin();}}>{children}</select>
  <button ref={trigger} type="button" role="combobox" aria-label={label} aria-expanded={open} aria-controls={id} aria-haspopup="listbox" aria-required={required||undefined} aria-activedescendant={open?`${id}-${active}`:undefined} disabled={disabled} className={'select-trigger'+(open?' expanded':'')} onClick={()=>open?setOpen(false):begin()} onKeyDown={keyDown} onBlur={e=>{if(!root.current?.contains(e.relatedTarget))setOpen(false);}}><span>{options[selected]?.label||'Select an option'}</span><ChevronDown size={17}/></button>
  {open&&<div ref={menu} id={id} role="listbox" aria-label={label} popover="manual" className="select-menu" onClick={e=>e.preventDefault()}>{options.map((option,index)=><div key={option.value} id={`${id}-${index}`} role="option" aria-selected={index===selected} aria-disabled={option.disabled||undefined} data-index={index} className={'select-option'+(index===selected?' selected':'')+(index===active?' active':'')+(option.disabled?' disabled':'')} onPointerDown={e=>e.preventDefault()} onPointerMove={()=>!option.disabled&&setActive(index)} onClick={()=>choose(index)}><span>{option.label}</span>{index===selected&&<Check size={16}/>}</div>)}</div>}
 </div>;
}
