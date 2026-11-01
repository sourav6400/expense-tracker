export const initialCalculator={display:'0',stored:null,operator:null,fresh:false};
const format=n=>Number.isFinite(n)?String(Number(n.toPrecision(12))):'Error';
export function calculate(a,b,op){
 if(op==='+')return a+b;
 if(op==='-')return a-b;
 if(op==='*')return a*b;
 if(op==='/')return b===0?NaN:a/b;
 return b;
}
export function calculatorStep(state,key){
 if(key==='clear')return {...initialCalculator};
 if(state.display==='Error')state={...initialCalculator};
 if(/^\d$/.test(key))return {...state,display:state.fresh||state.display==='0'?key:state.display.length<16?state.display+key:state.display,fresh:false};
 if(key==='.')return {...state,display:state.fresh?'0.':state.display.includes('.')?state.display:state.display+'.',fresh:false};
 if(key==='back')return {...state,display:state.fresh?'0':state.display.slice(0,-1).replace(/^-$|^$/,'0'),fresh:false};
 if(key==='sign')return {...state,display:format(-Number(state.display))};
 if(key==='%')return {...state,display:format(Number(state.display)/100)};
 if(['+','-','*','/','='].includes(key)){
  const result=state.operator&&state.stored!==null&&!state.fresh?calculate(state.stored,Number(state.display),state.operator):Number(state.display);
  const display=format(result);
  if(display==='Error')return {...initialCalculator,display};
  return {display,stored:key==='='?null:result,operator:key==='='?null:key,fresh:true};
 }
 return state;
}
