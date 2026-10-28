// Money is stored in integer poisha. A transfer moves value without changing net worth.
export function accountBalance(account, transactions) {
    return transactions.reduce((balance, transaction) => {
        if (transaction.account_id === account.id) {
            balance += transaction.type === 'income' ? transaction.amount : -transaction.amount;
        }
        if (transaction.destination_id === account.id) balance += transaction.amount;
        return balance;
    }, account.opening_balance);
}
export function budgetRemaining(budgets, transactions) {
    return budgets.reduce((remaining, budget) => remaining + budget.amount - transactions
        .filter(transaction => transaction.type === 'expense' && transaction.category_id === budget.category_id && transaction.date.startsWith(budget.month))
        .reduce((spent, transaction) => spent + transaction.amount, 0), 0);
}
