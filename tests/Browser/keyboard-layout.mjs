import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {build} from 'esbuild';

// Exercises real React forms and production CSS with a keyboard-sized visual viewport.
// A physical iPad is still needed to verify WebKit's native keyboard animation.
const bundle=await build({stdin:{contents:`
 import React,{useState} from 'react';
 import {createInertiaApp,router} from '@inertiajs/react';
 import Editor from './resources/js/Components/Editor';
 import Dashboard from './resources/js/Pages/Dashboard';
 import Auth from './resources/js/Pages/Auth';
 import Profile from './resources/js/Pages/Profile';
 import PasswordRecovery from './resources/js/Pages/PasswordRecovery';
 import AlertDialog from './resources/js/Components/AlertDialog';
 import Calculator from './resources/js/Components/Calculator';
 import {trackVisualViewport} from './resources/js/viewport';
 import {createRoot} from 'react-dom/client';
 const viewport=new EventTarget();Object.assign(viewport,{height:800,width:1280,offsetTop:0,offsetLeft:0});
 Object.defineProperty(window,'visualViewport',{value:viewport});
 window.setViewport=(height,top=0)=>{Object.assign(viewport,{height,offsetTop:top,width:innerWidth});viewport.dispatchEvent(new Event('resize'));viewport.dispatchEvent(new Event('scroll'));};
 trackVisualViewport();
 const accounts=[{id:1,name:'Cash',type:'Cash'},{id:2,name:'Bank',type:'Bank'}],categories=[{id:1,name:'Food'}];
 router.get=url=>{window.navigation=url};
 function Harness(){const [current,setCurrent]=useState('transactions');window.renderCase=setCurrent;
 if(current==='dashboard')return <Dashboard accounts={accounts} categories={categories} transactions={[]} budgets={[]}/>;
 if(current==='auth')return <Auth mode="register"/>;
 if(current==='profile')return <Profile/>;
 if(current==='recovery')return <PasswordRecovery mode="reset"/>;
 if(current==='alert')return <AlertDialog title="Delete transaction" message="Confirm deletion" onClose={()=>{}}/>;
 if(current==='calculator')return <Calculator onClose={()=>{}}/>;
 return <Editor pageLayout={window.matchMedia('(max-width:1024px), (pointer:coarse)').matches} key={current} modal={{resource:current,type:'expense'}} close={()=>{}} accounts={accounts} categories={categories} transactions={[]} month="2026-11"/>;}
 createInertiaApp({page:{component:'Harness',props:{auth:{user:{name:'Test',username:'test'}},flash:{}},url:'/',version:null},resolve:()=>Harness,setup:({el,App,props})=>createRoot(el).render(<App {...props}/>)});
 `,resolveDir:process.cwd(),loader:'jsx'},bundle:true,write:false,format:'iife',define:{'process.env.NODE_ENV':'"production"'}});
const manifest=JSON.parse(await readFile('public/build/manifest.json','utf8'));
const css=await readFile('public/build/'+manifest['resources/css/app.css'].file);
const server=createServer((req,res)=>{if(req.url==='/test.js'){res.setHeader('Content-Type','text/javascript');res.end(bundle.outputFiles[0].contents);}else if(req.url==='/test.css'){res.setHeader('Content-Type','text/css');res.end(css);}else{res.setHeader('Content-Type','text/html');res.end('<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/test.css"><div id="app"></div><script src="/test.js"></script>');}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const profile=await mkdtemp(path.join(tmpdir(),'ledger-browser-'));
const chrome=spawn(process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--remote-allow-origins=*',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',windowsHide:true});
let socket;
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
try {
 let port;
 for(let i=0;i<100;i++){try{port=(await readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0];break;}catch{await pause(100);}}
 assert.ok(port,'Chrome did not start');
 const pages=await fetch(`http://127.0.0.1:${port}/json/list`).then(r=>r.json());
 socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
 await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
 let id=0;const pending=new Map();
 socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.id){const {resolve,reject}=pending.get(message.id);pending.delete(message.id);message.error?reject(message.error):resolve(message.result);}});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const next=++id;pending.set(next,{resolve,reject});socket.send(JSON.stringify({id:next,method,params}));});
 const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});assert.ok(!result.exceptionDetails,JSON.stringify(result.exceptionDetails));return result.result.value;};
 await send('Page.enable');
 await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}`});
 for(let i=0;i<100;i++){if(await evaluate('!!window.renderCase'))break;await pause(50);}
 let checks=0;
 for(const [width,height,keyboardHeight,touch] of [[1440,900,320,false],[1280,800,320,true],[1024,768,260,true],[390,844,300,true]]) {
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:touch});
  await send('Emulation.setTouchEmulationEnabled',{enabled:touch});
  await evaluate("window.renderCase('dashboard');window.navigation=null");await pause(100);
  await evaluate("document.querySelector('.page-heading > button').click()");await pause(100);
  if(touch)assert.ok((await evaluate('window.navigation')).startsWith('/finance/transactions/create?'),'Touch devices must navigate to a page');
  else assert.ok(await evaluate("!!document.querySelector('[role=dialog]')"),'Desktop must retain the popup');checks++;
  for(const resource of ['transactions','accounts','categories','budgets']) {
   await evaluate(`window.renderCase('${resource}');window.setViewport(${height});`);await pause(80);
   if(touch){
    assert.ok(await evaluate("!!document.querySelector('.editor-page-shell')&&!document.querySelector('[role=dialog]')&&document.body.style.position!=='fixed'"),'Mobile editor must be a real document page');checks++;
    await send('Emulation.setDeviceMetricsOverride',{width,height:keyboardHeight,deviceScaleFactor:1,mobile:true});
    await evaluate(`window.setViewport(${keyboardHeight})`);
    const count=await evaluate("document.querySelectorAll('.modal-fields input:not([type=color])').length");
    for(let index=0;index<count;index++){
     await evaluate(`(()=>{const input=document.querySelectorAll('.modal-fields input:not([type=color])')[${index}];input.focus();input.scrollIntoView({block:'center'})})()`);await pause(100);
     const visible=await evaluate("(()=>{const r=document.activeElement.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&getComputedStyle(document.querySelector('.modal-fields')).overflowY==='visible'})()");
     assert.ok(visible,`${width} ${resource} field ${index} must scroll with the document`);checks++;
    }
    await evaluate("document.querySelector('.modal-actions').scrollIntoView({block:'end'})");await pause(100);
    assert.ok(await evaluate("document.querySelector('.modal-actions').getBoundingClientRect().bottom<=innerHeight"),'Save and Cancel must be reachable');checks++;
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});
    await evaluate(`document.activeElement.blur();window.setViewport(${height});window.scrollTo(0,0)`);
    continue;
   }
   const fields=await evaluate(`Array.from(document.querySelectorAll('.modal-fields input:not([type=color])')).map((_,i)=>i)`);
   for(const index of fields){
    await evaluate(`document.querySelectorAll('.modal-fields input:not([type=color])')[${index}].focus();window.setViewport(${keyboardHeight},35)`);await pause(700);
    const result=await evaluate(`(()=>{const input=document.activeElement,field=input.closest('label'),body=document.querySelector('.modal-fields'),modal=document.querySelector('.modal'),form=modal.querySelector('form'),footer=document.querySelector('.modal-actions');const r=field.getBoundingClientRect(),b=body.getBoundingClientRect(),f=footer.getBoundingClientRect(),m=modal.getBoundingClientRect();form.scrollTop=30;modal.scrollTop=30;return {visible:r.top>=b.top-1&&r.bottom<=b.bottom+1,footer:f.bottom<=35+${keyboardHeight},fills:m.height>=${keyboardHeight}-18,outerScroll:form.scrollTop+modal.scrollTop,rect:{top:r.top,bottom:r.bottom,bodyTop:b.top,bodyBottom:b.bottom}}})()`);
    assert.ok(result.visible,`${width} ${resource} field ${index}: ${JSON.stringify(result)}`);
    assert.ok(result.footer&&result.fills,`Unused keyboard space / hidden footer: ${JSON.stringify(result)}`);
    assert.equal(result.outerScroll,0,'Only the fields should scroll');checks++;
   }
   const hasSelect=await evaluate("!!document.querySelector('.modal-fields .select-trigger')");
   if(hasSelect){
    await evaluate(`document.querySelector('.modal-fields .select-trigger').focus();window.setViewport(${keyboardHeight},35)`);await pause(700);
    await evaluate("document.querySelector('.modal-fields .select-trigger').click()");await pause(100);
    const fits=await evaluate(`(()=>{const r=document.querySelector('.select-menu').getBoundingClientRect();return r.top>=35&&r.bottom<=35+${keyboardHeight}})()`);
    assert.ok(fits,`${resource} dropdown outside visible viewport`);checks++;
    await evaluate("document.querySelector('.select-trigger.expanded').click()");
   }
   const hasCalendar=await evaluate("!!document.querySelector('.modal-fields .date-trigger')");
   if(hasCalendar){
    await evaluate("document.querySelector('.modal-fields .date-trigger').click()");await pause(100);
    const reachable=await evaluate("(()=>{const b=document.querySelector('.modal-fields');b.scrollTop=b.scrollHeight;const r=document.querySelector('.calendar-panel').getBoundingClientRect();return r.bottom<=b.getBoundingClientRect().bottom+1})()");
    assert.ok(reachable,`${resource} calendar cannot scroll into view`);checks++;
    await evaluate("document.querySelector('[aria-label=\"Close calendar\"]').click()");
   }
   await evaluate(`document.activeElement.blur();window.setViewport(${height})`);await pause(700);
   assert.ok(await evaluate("!document.querySelector('.modal-backdrop').classList.contains('modal-compact')"),'Keyboard dismissal must restore normal layout');checks++;
  }
  for(const page of ['auth','profile','recovery']){
   await evaluate(`window.renderCase('${page}');window.setViewport(${keyboardHeight},0)`);await pause(100);
   const result=await evaluate(`Array.from(document.querySelectorAll('input:not([type=file])')).every(el=>parseFloat(getComputedStyle(el).fontSize)>=16)`);
   if(touch)assert.ok(result,`${page} must not zoom on touch focus`);checks++;
  }
  for(const page of ['alert','calculator']){
   await evaluate(`window.renderCase('${page}');window.setViewport(${keyboardHeight},35)`);await pause(100);
   const fits=await evaluate(`(()=>{const r=document.querySelector('dialog').getBoundingClientRect();return r.top>=35&&r.bottom<=35+${keyboardHeight}})()`);
   assert.ok(fits,`${page} outside keyboard viewport`);checks++;
  }
 }
 console.log(`Passed ${checks} browser layout checks across desktop, tablet landscape, tablet portrait, and phone sizes.`);
} finally {
 socket?.close();chrome.kill();server.close();await pause(500);
 await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});
}
