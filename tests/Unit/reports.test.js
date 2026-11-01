import test from 'node:test';
import assert from 'node:assert/strict';
import {accountTransactions,reportTransactions} from '../../resources/js/reports.js';

const transactions=[
 {id:1,date:'2026-11-01',account_id:1,category_id:10,type:'expense',amount:100},
 {id:2,date:'2026-11-02',account_id:2,category_id:20,type:'income',amount:200},
 {id:3,date:'2026-11-03',account_id:2,destination_id:1,category_id:null,type:'transfer',amount:50},
 {id:4,date:'2026-10-01',account_id:1,category_id:30,type:'expense',amount:300},
 {id:5,date:'2026-11-04',account_id:1,category_id:20,type:'income',amount:400},
];
test('account scope includes incoming transfers and categories across months',()=>{
 assert.deepEqual(accountTransactions(transactions,'1').map(t=>t.id),[1,3,4,5]);
 assert.equal(accountTransactions(transactions).length,5);
});
test('report combines month, account and multiple category filters',()=>{
 assert.deepEqual(reportTransactions(transactions,'2026-11','1').map(t=>t.id),[1,3,5]);
 assert.deepEqual(reportTransactions(transactions,'2026-11','1',['10','20']).map(t=>t.id),[1,5]);
 assert.deepEqual(reportTransactions(transactions,'2026-11','all',['20']).map(t=>t.id),[2,5]);
 assert.deepEqual(reportTransactions(transactions,'2026-11','1',['30']),[]);
 assert.deepEqual(reportTransactions(transactions,'2026-09'),[]);
});
test('type filter combines with account and category and includes incoming transfers',()=>{
 assert.deepEqual(reportTransactions(transactions,'2026-11','1',[],'transfer').map(t=>t.id),[3]);
 assert.deepEqual(reportTransactions(transactions,'2026-11','1',['20'],'income').map(t=>t.id),[5]);
 assert.deepEqual(reportTransactions(transactions,'2026-11','1',['10'],'income'),[]);
 assert.deepEqual(reportTransactions(transactions,'2026-11','all',[],'expense').map(t=>t.id),[1]);
});
