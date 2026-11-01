export function accountTransactions(transactions, accountId='all') {
 return transactions.filter(t=>accountId==='all'||String(t.account_id)===String(accountId)||String(t.destination_id)===String(accountId));
}
export function reportTransactions(transactions, month, accountId='all', categoryIds=[], type='all') {
 return accountTransactions(transactions,accountId).filter(t=>t.date.startsWith(month)&&(!categoryIds.length||categoryIds.includes(String(t.category_id)))&&(type==='all'||t.type===type));
}
