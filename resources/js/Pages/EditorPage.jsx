import React from 'react';
import {router} from '@inertiajs/react';
import Editor from '../Components/Editor';

export default function EditorPage({modal,accounts,categories,transactions,month,returnUrl}) {
 return <Editor pageLayout modal={modal} accounts={accounts} categories={categories} transactions={transactions} month={month} returnUrl={returnUrl} close={()=>router.visit(returnUrl)}/>;
}
