import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateValues,generateDocument} from '../autofill-engine.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(await readFile(path.join(root,'templates/autofill/manifest.json'),'utf8'));
const template=id=>{const t=manifest.templates.find(t=>t.id===id);assert.ok(t,`${id} manifest entry exists`);return t;};
const fixture={student_full_name:'María Dela Peña',student_number:'2026-00123',company_name:'Example Systems & Research',company_address:'123 Sample Street, Iligan City, Lanao del Norte, Philippines',recipient_name:'Ana Cruz',recipient_title:'Human Resources Manager',dean_title:'Atty.',dean_name:'Sample College Dean',chairperson_title:'Asst. Prof.',chairperson_name:'Sample Chairperson',coordinator_title:'Asst. Prof.',coordinator_name:'Sample Coordinator',additional_student_2:'',additional_student_3:'',event_title:'Supervised On-the-Job Training',waiver_duration:'November 1, 2026 to February 28, 2027',guardian_name:"Rosa O'Connor"};
const docText=bytes=>execFileSync('python3',['-c',`import sys,io,zipfile,xml.etree.ElementTree as E
z=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read()))
r=E.fromstring(z.read('word/document.xml'))
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
print('\\n'.join(''.join(p.itertext()) for p in r.findall('.//w:p',ns)))`],{input:Buffer.from(bytes),encoding:'utf8'});
async function generate(id,values=fixture,format='docx'){
 const t=template(id);const opts={templateId:id,values,format,manifest,templateBytes:new Uint8Array(await readFile(path.join(root,t[format])))};
 if(format==='pdf'){
  opts.fontBytes=new Uint8Array(await readFile(path.join(root,t.font||'vendor/DejaVuSerif.ttf')));
  if(t.boldFont)opts.boldFontBytes=new Uint8Array(await readFile(path.join(root,t.boldFont)));
 }
 return generateDocument(opts);
}
test('MOA and waiver reuse canonical identity and designation fields',()=>{
 for(const id of ['moa','waiver']){
  const t=template(id);assert.ok(t.fields.includes('student_full_name'));assert.ok(t.fields.includes('dean_name'));assert.ok(t.fields.includes('dean_title'));
  assert.equal(new Set(t.fields).size,t.fields.length);
  for(const key of t.fields)assert.ok(manifest.fields[key],`${key} has field rules`);
  assert.equal(validateValues(id,fixture,manifest).student_full_name,fixture.student_full_name);
 }
 for(const key of ['dean_title','chairperson_title','coordinator_title'])assert.ok(manifest.fields[key].options.includes('Atty.'),`${key} supports Atty.`);
});
test('designation dropdown values are validated rather than arbitrary text',()=>{
 for(const id of ['moa','waiver'])assert.throws(()=>validateValues(id,{...fixture,dean_title:'Made-up title'},manifest));
 for(const key of ['coordinator_title','chairperson_title'])assert.throws(()=>validateValues('moa',{...fixture,[key]:'Made-up title'},manifest));
});
test('MOA requires one student and permits optional additional students',()=>{
 assert.doesNotThrow(()=>validateValues('moa',fixture,manifest));
 assert.throws(()=>validateValues('moa',{...fixture,student_full_name:''},manifest));
 assert.doesNotThrow(()=>validateValues('moa',{...fixture,additional_student_2:'Second Student',additional_student_3:'Third Student'},manifest));
});
test('MOA rejects duplicate student names and a third student without the second',()=>{
 for(const values of [
  {...fixture,additional_student_2:fixture.student_full_name},
  {...fixture,additional_student_2:'Second Student',additional_student_3:' second student '},
  {...fixture,additional_student_3:'Third Student'}
 ])assert.throws(()=>validateValues('moa',values,manifest));
});
test('waiver requires explicit activity, duration and guardian details',()=>{
 for(const key of ['event_title','waiver_duration','guardian_name'])assert.throws(()=>validateValues('waiver',{...fixture,[key]:''},manifest),key+' required');
});
test('new templates substitute placeholders and remove drafting notes',async()=>{
 for(const id of ['moa','waiver']){
  const bytes=await generate(id);assert.ok(bytes.length>1000);const text=docText(bytes);
  assert.ok(text.includes(fixture.student_full_name));assert.ok(text.includes(fixture.dean_name));
  for(const key of template(id).fields)assert.ok(!text.includes('{'+key+'}'),`${id} unresolved ${key}`);
  assert.ok(!/\bundefined\b|\[object Object\]/.test(text));
  assert.ok(!/note:|use dropdown|only if ther|additional student name if applicable/i.test(text));
  if(id==='waiver'){assert.ok(text.includes(fixture.guardian_name));assert.ok(text.includes(fixture.event_title));assert.ok(text.includes(fixture.waiver_duration));}
 }
});
test('MOA optional student names appear only when supplied in list and signature slots',async()=>{
 const single=docText(await generate('moa'));
 assert.equal((single.match(/Student Trainee/g)||[]).length,1,'one actual trainee signature label');
 for(const [number,values]of [[2,{...fixture,additional_student_2:'Second Sample Student'}],[3,{...fixture,additional_student_2:'Second Sample Student',additional_student_3:'Third Sample Student'}]]){
  const text=docText(await generate('moa',values));
  assert.equal((text.match(/Student Trainee/g)||[]).length,number,`${number} actual trainee signature labels`);
  for(const name of ['Second Sample Student',...(number===3?['Third Sample Student']:[])])assert.equal(text.split(name).length-1,2,`${name} in list and signature`);
 }
});
test('notarial and execution fields remain for authorized completion',async()=>{
 const moa=docText(await generate('moa')),waiver=docText(await generate('waiver'));
 assert.ok(moa.includes('700 hours'),'fixed program hours preserved');
 assert.ok(moa.includes('SPECIAL ORDER No. 00959-IIT Series of 2025'),'legal authorization year preserved');
 assert.equal((moa.match(/2025/g)||[]).length,1,'only fixed Special Order retains 2025');
 assert.equal((waiver.match(/2025/g)||[]).length,0,'waiver notarial year is not stale');
 for(const text of [moa,waiver])assert.ok(/_{3,}/.test(text),'official blanks remain');
});
test('new Word documents preserve Unicode and escape XML-like company names',async()=>{
 const text=docText(await generate('moa',{...fixture,company_name:'A < B & C "Research"'}));
 assert.ok(text.includes('A < B & C "Research"'));assert.ok(text.includes('María Dela Peña'));
});
test('configured PDF downloads generate readable files and no unresolved fields',async()=>{
 const out=path.join(root,'development/qa-moa-waiver');await mkdir(out,{recursive:true});
 for(const id of ['moa','waiver']){
  const t=template(id);if(!t.formats?.includes('pdf'))continue;
  const bytes=await generate(id,fixture,'pdf');assert.ok(bytes.length>1000);
  const filename=path.join(out,id+'.pdf');await writeFile(filename,bytes);
  const text=execFileSync('pdftotext',[filename,'-'],{encoding:'utf8'});
  for(const key of t.fields)assert.ok(!text.includes('{'+key+'}'),`${id} PDF unresolved ${key}`);
  assert.ok(text.includes(fixture.student_full_name));assert.ok(text.includes(fixture.dean_name));
 }
});
