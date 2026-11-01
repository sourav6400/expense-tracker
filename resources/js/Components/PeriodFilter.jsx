import React from 'react';
import {ChevronLeft,ChevronRight} from 'lucide-react';
import DateField from './DateField';

export default function PeriodFilter({mode,onModeChange,month,onMonthChange,currentMonth,today,from,to,onFromChange,onToChange}){
 const shift=delta=>{const date=new Date(month+'-15T12:00:00Z');date.setUTCMonth(date.getUTCMonth()+delta);onMonthChange(date.toISOString().slice(0,7));};
 return <div className="period-filter">
  <div className="period-mode" role="group" aria-label="Filter period"><button type="button" aria-pressed={mode==='month'} onClick={()=>onModeChange('month')}>By month</button><button type="button" aria-pressed={mode==='range'} onClick={()=>onModeChange('range')}>Date range</button></div>
  {mode==='month'?<div className="period-select"><button aria-label="Previous month" onClick={()=>shift(-1)}><ChevronLeft size={15}/></button><DateField className="reporting-month" aria-label="Reporting month" type="month" max={currentMonth} value={month} onChange={e=>onMonthChange(e.target.value)}/><button aria-label="Next month" disabled={month>=currentMonth} onClick={()=>shift(1)}><ChevronRight size={15}/></button></div>:<div className="date-range-fields"><div className="range-field"><span>From date</span><DateField aria-label="From date" value={from} max={to||today} onChange={e=>onFromChange(e.target.value)}/></div><div className="range-field"><span>To date</span><DateField aria-label="To date" value={to} min={from} max={today} onChange={e=>onToChange(e.target.value)}/></div></div>}
 </div>;
}
