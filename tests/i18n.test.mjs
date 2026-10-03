import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {roles,schemas} from '../server/domain.mjs';
const dictionary=JSON.parse(readFileSync(new URL('../src/platform/translations.json',import.meta.url),'utf8').replace(/^\uFEFF/,''));
test('four language catalog covers role, field and enum labels without changing canonical values',()=>{
 for(const [source,translations] of Object.entries(dictionary)){assert.equal(translations.length,3,source);assert(translations.every(v=>typeof v==='string'&&v.trim()),source);assert(!/[\u0600-\u06ff]/.test(translations[0]),`English contains Persian: ${source}`);assert(!/[\u0600-\u06ff]/.test(translations[2]),`Turkish contains Persian: ${source}`);}
 const missing=[];for(const source of [...Object.values(roles),...Object.values(schemas).flatMap(s=>[s.title,s.description,...s.fields.flatMap(f=>[f.label,...(f.options||[])])])])if(/[\u0600-\u06ff]/.test(source)&&!dictionary[source])missing.push(source);assert.deepEqual(missing,[]);
});
test('active operational UI has complete translation keys and no untranslated Persian JSX text',()=>{
 const missing=[],literal=[];
 for(const path of ['src/App.tsx',...['PublicLanding','DemoLogin','PersonalWorkspace','RolePriorities','BenefitCalculator'].map(n=>`src/platform/${n}.tsx`)]){
  const text=readFileSync(new URL('../'+path,import.meta.url),'utf8');const ast=ts.createSourceFile(path,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  function visit(node){if(ts.isJsxText(node)&&/[\u0600-\u06ff]/.test(node.text))literal.push([path,node.text.trim()]);if(ts.isCallExpression(node)&&node.expression.getText(ast)==='t'&&node.arguments.length&&ts.isStringLiteral(node.arguments[0])){const source=node.arguments[0].text;if(/[\u0600-\u06ff]/.test(source)&&!dictionary[source])missing.push([path,source]);}ts.forEachChild(node,visit);}visit(ast);
 }
 assert.deepEqual(literal,[],'Raw Persian visible in translated UI');assert.deepEqual(missing,[],'Missing dictionary keys');
});
test('Persian calendar date is consistent in all four language locales',()=>{
 for(const locale of ['fa','en','ar','tr']){const fmt=new Intl.DateTimeFormat(locale+'-u-ca-persian-nu-latn',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Tehran'});const parts=Object.fromEntries(fmt.formatToParts(new Date('2026-10-03T12:00:00Z')).map(p=>[p.type,p.value]));assert.equal(parts.year,'1405');assert.equal(parts.month,'07');assert.equal(parts.day,'11');}
});
