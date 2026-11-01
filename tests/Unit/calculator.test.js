import test from 'node:test';
import assert from 'node:assert/strict';
import {calculatorStep,initialCalculator} from '../../resources/js/calculator.js';
const run=keys=>keys.reduce(calculatorStep,initialCalculator);
test('calculator handles arithmetic, decimals and chained operations',()=>{
 assert.equal(run(['1','0','+','5','=']).display,'15');
 assert.equal(run(['9','-','3','=']).display,'6');
 assert.equal(run(['3','*','4','=']).display,'12');
 assert.equal(run(['8','/','2','=']).display,'4');
 assert.equal(run(['0','.','1','+','0','.','2','=']).display,'0.3');
 assert.equal(run(['2','+','3','*','4','=']).display,'20');
});
test('calculator handles correction, percent, negative numbers and errors',()=>{
 assert.equal(run(['5','0','%']).display,'0.5');
 assert.equal(run(['5','sign']).display,'-5');
 assert.equal(run(['1','2','back']).display,'1');
 assert.equal(run(['2','+','*','3','=']).display,'6');
 assert.equal(run(['9','/','0','=']).display,'Error');
 assert.equal(run(['9','/','0','=','7']).display,'7');
 assert.deepEqual(run(['9','+','clear']),initialCalculator);
 assert.equal(run(['2','+','3','=','4']).display,'4');
});
