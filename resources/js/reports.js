export function accountTransactions(transactions, accountId='all') {
 return transactions.filter(t=>accountId==='all'||String(t.account_id)===String(accountId)||String(t.destination_id)===String(accountId));
}
export function reportTransactions(transactions, month, accountId='all', categoryIds=[], type='all') {
 return accountTransactions(transactions,accountId).filter(t=>(typeof month==='string'?t.date.startsWith(month):Boolean(month.from&&month.to&&month.from<=month.to&&t.date>=month.from&&t.date<=month.to))&&(!categoryIds.length||categoryIds.includes(String(t.category_id)))&&(type==='all'||t.type===type));
}
