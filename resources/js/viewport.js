// VisualViewport follows the on-screen keyboard; dvh alone does not on iPadOS.
export function observeVisualViewport(callback,win=window,doc=document) {
 const viewport=win.visualViewport;
 let frame, timers=[];
 const update=()=>{
  win.cancelAnimationFrame(frame);
  frame=win.requestAnimationFrame(()=>callback({height:viewport?.height||win.innerHeight,top:viewport?.offsetTop||0}));
 };
 // WebKit can finish its automatic focus pan after focusin and the first resize.
 const settle=()=>{
  timers.forEach(timer=>win.clearTimeout(timer));
  update();
  timers=[100,300,600].map(delay=>win.setTimeout(update,delay));
 };
 viewport?.addEventListener('resize',update);
 viewport?.addEventListener('scroll',update);
 win.addEventListener('resize',settle);
 doc.addEventListener('focusin',settle);
 doc.addEventListener('focusout',settle);
 update();
 return()=>{
  win.cancelAnimationFrame(frame);
  timers.forEach(timer=>win.clearTimeout(timer));
  viewport?.removeEventListener('resize',update);
  viewport?.removeEventListener('scroll',update);
  win.removeEventListener('resize',settle);
  doc.removeEventListener('focusin',settle);
  doc.removeEventListener('focusout',settle);
 };
}

export function trackVisualViewport() {
 return observeVisualViewport(({height,top})=>{
  const root=document.documentElement;
  root.style.setProperty('--visible-height',height+'px');
  root.style.setProperty('--visible-top',top+'px');
  root.classList.toggle('viewport-short',height<500);
 });
}
