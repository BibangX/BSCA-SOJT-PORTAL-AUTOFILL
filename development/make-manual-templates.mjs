import {readFile,writeFile} from 'node:fs/promises';
import {generateDocument} from '../autofill-engine.js';
const root=new URL('../',import.meta.url);
const original=JSON.parse(await readFile(new URL('templates/autofill/manifest.json',root)));
for(const [id,file] of [['moa','moa.docx'],['waiver','liability-waiver.docx'],['endorsement','endorsement-letter.docx']]){
 const manifest=structuredClone(original),t=manifest.templates.find(t=>t.id===id),values={};
 for(const key of t.fields){manifest.fields[key]={...manifest.fields[key],required:false,maxLength:200,type:'text',options:undefined,pattern:undefined};values[key]=key.startsWith('additional_student_')||key.endsWith('_pronouns')?'':'____________';}
 const bytes=await generateDocument({templateId:id,values,format:'docx',manifest,templateBytes:new Uint8Array(await readFile(new URL(t.docx,root)))});
 await writeFile(new URL('templates/'+file,root),bytes);
}
