import ts from 'typescript';
import {readFileSync} from 'node:fs';
const allowed=new Set(['platform/economics','platform/calendar','platform/csv','components/labMath','platform/operationsInsights']);
export async function loadTs(module){
 if(!allowed.has(module))throw new Error('Test module is outside the calculation kernel');
 const file=new URL(`../src/${module}.ts`,import.meta.url),source=readFileSync(file,'utf8');
 const {outputText}=ts.transpileModule(source,{fileName:file.pathname,compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}});
 return import('data:text/javascript;base64,'+Buffer.from(outputText+`\n//# sourceURL=fanarlool-calculation/${module}.js`).toString('base64'));
}
