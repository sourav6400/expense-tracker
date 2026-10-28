import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accountBalance, budgetRemaining } from '../../resources/js/finance.js';
test('transfers conserve total balances and editing/deletion derives fresh balances', () => {
    const bank = { id: 1, opening_balance: 100000 };
    const wallet = { id: 2, opening_balance: 0 };
    const transfer = { account_id: 1, destination_id: 2, type: 'transfer', amount: 25000 };
    assert.equal(accountBalance(bank, [transfer]), 75000);
    assert.equal(accountBalance(wallet, [transfer]), 25000);
    assert.equal(accountBalance(bank, [transfer]) + accountBalance(wallet, [transfer]), 100000);
    assert.equal(accountBalance(bank, [{ ...transfer, amount: 30000 }]), 70000);
    assert.equal(accountBalance(bank, []), 100000);
    assert.equal(accountBalance(bank, [{account_id:1,type:'income',amount:1235},{account_id:1,type:'expense',amount:235}]), 101000);
});
test('budget remaining counts only budgeted expenses in the selected month', () => {
    const budgets = [{ category_id: 1, month: '2026-10', amount: 10000 }];
    const transactions = [
        { category_id: 1, date: '2026-10-28', type: 'expense', amount: 2000 },
        { category_id: 2, date: '2026-10-28', type: 'expense', amount: 5000 },
        { category_id: 1, date: '2026-09-28', type: 'expense', amount: 5000 },
        { category_id: 1, date: '2026-10-28', type: 'transfer', amount: 5000 },
    ];
    assert.equal(budgetRemaining(budgets, transactions), 8000);
});
