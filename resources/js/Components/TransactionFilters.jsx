import Select from './Select';
import React from 'react';

export default function TransactionFilters({accounts,categories,accountId,categoryId,type,onAccountChange,onCategoryChange,onTypeChange,children}) {
 return <div className="transaction-filters">
  {children}
  <label>Account<Select aria-label="Filter by account" value={accountId} onChange={e=>onAccountChange(e.target.value)}><option value="all">All accounts</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</Select></label>
  <label>Category<Select aria-label="Filter by category" value={categoryId} onChange={e=>onCategoryChange(e.target.value)}><option value="all">All categories</option>{categoryId==='selected'&&<option value="selected">Selected categories</option>}{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Select></label>
  <label>Type<Select aria-label="Filter by type" value={type} onChange={e=>onTypeChange(e.target.value)}><option value="all">All types</option><option value="expense">Expenses</option><option value="income">Income</option><option value="transfer">Transfers</option></Select></label>
 </div>;
}
