import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(new URL('./package.json',import.meta.url));
const PizZip=require('pizzip');
const {PDFDocument}=require('pdf-lib');
import {validateValues,downloadFilename,generateDocument} from './engine-source.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(await readFile(path.join(root,'templates/autofill/manifest.json'),'utf8'));
const fixture={student_full_name:"María-José Dela Peña O'Connor",student_number:'2026-00123',school_email:'student@g.msuiit.edu.ph',year_level:'4th year',semester:'1st semester',academic_year:'2026-2027',start_date:'2026-11-01',end_date:'2027-02-28',remaining_units:'0',adviser_name:'Ana María Santos',program_of_study_note:'BS Computer Applications',company_name:'A & B Systems',company_address:'123 Example Street, Barangay Poblacion, Iligan City, Lanao del Norte 9200, Philippines',recipient_name:'Ms. Elena Cruz',recipient_title:'Human Resources Manager',company_email:'hr@example.com',company_phone:'+63 917 123 4567',acceptance_link:'https://drive.google.com/file/d/example/view',letter_date:'2026-10-22',required_hours:'486'};
const templates=manifest.templates;
function valuesFor(t){const values={...fixture};for(const key of t.fields){if(values[key]!==undefined)continue;const f=manifest.fields[key];values[key]=f.default??(f.options?.[0]?.value??f.options?.[0])??(f.type==='date'?'2026-11-01':f.type==='email'?'test@example.com':f.type==='number'?'1':'Sample value');}return values;}
function templateWith(key){return templates.find(t=>t.fields.includes(key));}

test('all three masters have field definitions and unique stable IDs',()=>{
 assert.equal(templates.length,3);assert.equal(new Set(templates.map(t=>t.id)).size,3);
 for(const t of templates){assert.ok(t.fields.length);assert.equal(new Set(t.fields).size,t.fields.length);for(const k of t.fields)assert.ok(manifest.fields[k],`${t.id}: unknown field ${k}`);}
});
test('valid Unicode names, apostrophes and zero remaining units are accepted',()=>{
 for(const t of templates){const values=valuesFor(t);const result=validateValues(t.id,values,manifest);assert.equal(result.student_full_name,fixture.student_full_name);if(t.fields.includes('remaining_units'))assert.equal(String(result.remaining_units),'0');}
});
test('missing required input and overlong input are blocked before download',()=>{
 for(const t of templates){for(const k of t.fields){const f=manifest.fields[k];if(f.required){assert.throws(()=>validateValues(t.id,{...valuesFor(t),[k]:''},manifest),`${t.id}.${k} must be required`);}if(f.maxLength){assert.throws(()=>validateValues(t.id,{...valuesFor(t),[k]:'X'.repeat(f.maxLength+1)},manifest),`${t.id}.${k} length must be enforced`);}}}
});
test('invalid dates and inverted training period are rejected; a real leap date is valid',()=>{
 const t=templateWith('start_date');assert.ok(t);const base=valuesFor(t);
 assert.throws(()=>validateValues(t.id,{...base,start_date:'2026-02-30'},manifest));
 assert.throws(()=>validateValues(t.id,{...base,start_date:'2027-03-01',end_date:'2027-02-28'},manifest));
 assert.doesNotThrow(()=>validateValues(t.id,{...base,start_date:'2028-02-29',end_date:'2028-03-01'},manifest));
});
test('invalid email and nonsensical numbers are rejected',()=>{
 const t=templateWith('school_email');assert.ok(t);assert.throws(()=>validateValues(t.id,{...valuesFor(t),school_email:'not-an-email'},manifest));
 const hours=templateWith('required_hours');if(hours){assert.throws(()=>validateValues(hours.id,{...valuesFor(hours),required_hours:'-1'},manifest));assert.throws(()=>validateValues(hours.id,{...valuesFor(hours),required_hours:'abc'},manifest));}
});
test('unknown template IDs are blocked and filename path characters cannot escape downloads',()=>{
 assert.throws(()=>validateValues('not-a-template',fixture,manifest));
 for(const t of templates){for(const format of ['docx','pdf']){const filename=downloadFilename(t.id,{...fixture,student_number:'../../bad\\name\n',student_full_name:'../../Bad/Name'},format);assert.ok(!/[\\/\r\n\x00]/.test(filename));assert.ok(filename.endsWith('.'+format));}}
});

// Binary generation tests are completed with the final checked master locations/font.

test('academic year must match format and adjacent years',()=>{
 const t=templateWith('academic_year');assert.ok(t);
 for(const academic_year of ['2026–2027','2026-2030','not-a-year'])assert.throws(()=>validateValues(t.id,{...valuesFor(t),academic_year},manifest));
});
test('unknown extra fields are excluded from document values',()=>{
 const t=templates[0];const clean=validateValues(t.id,{...valuesFor(t),signature:'forged',approval:'approved',__extra:'secret'},manifest);
 assert.equal(clean.signature,undefined);assert.equal(clean.approval,undefined);assert.equal(clean.__extra,undefined);
});

test('all six Unicode Word/PDF outputs fill mapped values and PDF fields are flattened',async()=>{
 const {mkdir,writeFile}=await import('node:fs/promises');
 const output=path.resolve(root,'development/qa-output');await mkdir(output,{recursive:true});
 const fontBytes=new Uint8Array(await readFile(path.join(root,'vendor/DejaVuSerif.ttf')));
 for(const t of templates){
  const values=valuesFor(t);
  for(const format of ['docx','pdf']){
   const templateBytes=new Uint8Array(await readFile(path.join(root,t[format])));
   const selectedFont=t.font?new Uint8Array(await readFile(path.join(root,t.font))):fontBytes;
   const boldFontBytes=t.boldFont?new Uint8Array(await readFile(path.join(root,t.boldFont))):undefined;
   const bytes=await generateDocument({templateId:t.id,values,format,manifest,templateBytes,fontBytes:selectedFont,boldFontBytes});
   assert.ok(bytes.length>1000,`${t.id}.${format} must contain an actual document`);
   await writeFile(path.join(output,t.id+'.'+format),bytes);
   if(format==='docx'){
    const zip=new PizZip(bytes);const xml=zip.file('word/document.xml').asText();
    assert.ok(xml.includes('María-José Dela Peña O&apos;Connor')||xml.includes("María-José Dela Peña O'Connor"));
    for(const key of t.fields)assert.ok(!xml.includes('{'+key+'}'),`${t.id} unresolved ${key}`);
    assert.ok(!xml.includes('undefined'));assert.ok(!xml.includes('[object Object]'));
   }else{
    const pdf=await PDFDocument.load(bytes);assert.ok(pdf.getPageCount()>=1);assert.equal(pdf.getForm().getFields().length,0,`${t.id} final PDF must not retain editable field widgets`);
   }
  }
 }
});
test('DOCX data is XML-escaped and values cannot become template/XML instructions',async()=>{
 const t=templateWith('company_name');const values={...valuesFor(t),company_name:'A < B & C "Research" {not_a_tag}'};
 const bytes=await generateDocument({templateId:t.id,values,format:'docx',manifest,templateBytes:new Uint8Array(await readFile(path.join(root,t.docx)))});
 const xml=new PizZip(bytes).file('word/document.xml').asText();assert.ok(xml.includes('A &lt; B &amp; C'));assert.ok(xml.includes('{not_a_tag}'));assert.ok(!xml.includes('A < B & C'));
});

test('long unbreakable PDF values fail clearly instead of silently clipping',async()=>{
 const t=templateWith('company_name');const fontBytes=new Uint8Array(await readFile(path.join(root,'vendor/DejaVuSerif.ttf')));
 const values={...valuesFor(t),company_name:'W'.repeat(manifest.fields.company_name.maxLength)};
 await assert.rejects(async()=>generateDocument({templateId:t.id,values,format:'pdf',manifest,templateBytes:new Uint8Array(await readFile(path.join(root,t.pdf))),fontBytes}),/does not fit the PDF/);
 assert.ok((await generateDocument({templateId:t.id,values,format:'docx',manifest,templateBytes:new Uint8Array(await readFile(path.join(root,t.docx)))})).length>1000);
});
test('Drive evidence must be a direct HTTPS file link, not a folder or lookalike host',()=>{
 const t=templateWith('acceptance_link');assert.ok(t);
 for(const acceptance_link of ['https://drive.google.com/drive/folders/abc','https://drive.google.com.evil.test/file/d/abc/view','http://drive.google.com/file/d/abc/view','https://user:password@drive.google.com/file/d/abc/view'])assert.throws(()=>validateValues(t.id,{...valuesFor(t),acceptance_link},manifest));
});
test('printable values reject controls and unsupported output formats',async()=>{
 const t=templates[0];assert.throws(()=>validateValues(t.id,{...valuesFor(t),student_full_name:'Bad\u0001Name'},manifest));
 await assert.rejects(()=>generateDocument({templateId:t.id,values:valuesFor(t),format:'exe',manifest,templateBytes:new Uint8Array()}));
});

test('unsupported PDF font characters fail clearly while editable Word preserves the name',async()=>{
 const t=templates[0],values={...valuesFor(t),student_full_name:'Sample 🧭 Student'};
 const fontBytes=await readFile(path.join(root,'vendor/DejaVuSerif.ttf'));
 await assert.rejects(()=>generateDocument({templateId:t.id,values,format:'pdf',manifest,templateBytes:undefined,fontBytes}),/print font/);
 const output=await generateDocument({templateId:t.id,values,format:'docx',manifest,templateBytes:await readFile(path.join(root,t.docx))});assert.ok(new PizZip(output).file('word/document.xml').asText().includes('🧭'));
});

test('supplied endorsement keeps original inline wording, repeats values and contains no form tables',async()=>{
 const t=templates.find(t=>t.id==='endorsement');
 assert.ok(!t.fields.includes('required_hours'),'700 training hours are fixed institutional wording in this template');
 const values={...valuesFor(t),recipient_name:'Dr. Elena María Cruz',company_name:'Example Research Office',placement_department:'Research and Development Department',coordinator_title:'Asst. Prof.',coordinator_name:'Excel Van O. Jondonero',chairperson_title:'Asst. Prof.',chairperson_name:'Paul Rodolf P. Castor'};
 const bytes=await generateDocument({templateId:t.id,values,format:'docx',manifest,templateBytes:await readFile(path.join(root,t.docx))});
 const xml=new PizZip(bytes).file('word/document.xml').asText();
 const plain=xml.replace(/<[^>]+>/g,'').replace(/&apos;/g,"'").replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
 assert.equal((xml.match(/<w:tbl[ >]/g)||[]).length,0,'letter must keep its inline paragraphs rather than turn into a boxed form');
 assert.equal((plain.match(/700 hours/g)||[]).length,2);assert.ok(plain.includes('second semester'));assert.ok(plain.includes('18 weeks'));
 assert.equal((plain.match(/Dr\. Elena María Cruz/g)||[]).length,2,'recipient must appear in address block and salutation');
 assert.equal((plain.match(/November 1, 2026/g)||[]).length,2,'starting date must fill both narrative occurrences');
 for(const phrase of ['To know more of the','To perform simulations and practical aids','To see a step-by-step demonstration','To prove by actual assessments'])assert.ok(plain.includes(phrase),`missing original objective ${phrase}`);
 for(const value of [fixture.student_full_name,values.company_name,values.placement_department,values.coordinator_name,values.chairperson_name])assert.ok(plain.includes(value),`missing mapped value ${value}`);
 assert.ok(!/\{(?:Date|office|name|address|starting date|student name|Office\/Department|coordinator name|chairperson name)\}/.test(plain));
});
test('endorsement designation dropdowns reject unlisted titles',()=>{
 const t=templates.find(t=>t.id==='endorsement');
 for(const key of ['coordinator_title','chairperson_title']){assert.ok(t.fields.includes(key));assert.ok(Array.isArray(manifest.fields[key].options));assert.throws(()=>validateValues(t.id,{...valuesFor(t),[key]:'Unlisted Signatory Role'},manifest));}
});

test('endorsement optional department reuses company name and long values produce complete paginated files',async()=>{
 const t=templates.find(t=>t.id==='endorsement');
 const values={...valuesFor(t),placement_department:'',company_name:'Example Research Office'};
 const docx=await generateDocument({templateId:t.id,values,format:'docx',manifest,templateBytes:await readFile(path.join(root,t.docx))});
 const xml=new PizZip(docx).file('word/document.xml').asText();assert.equal((xml.match(/Example Research Office/g)||[]).length,2,'office/department fallback must not leave a blank in the request');
 const long={...valuesFor(t),student_full_name:'María Elena Dela Peña O’Connor '.repeat(3).slice(0,80),recipient_name:'Dr. María Elena Santos Dela Cruz '.repeat(3).slice(0,80),company_name:'International Research and Development Applications Company '.repeat(3).slice(0,120),company_address:'123 Research Avenue, Barangay Poblacion, Iligan City, Lanao del Norte, Philippines '.repeat(3).slice(0,220),placement_department:'Research Development and Applications Department '.repeat(3).slice(0,120),coordinator_title:'Asst. Prof.',coordinator_name:'Excel Van O. Jondonero '.repeat(4).slice(0,80),chairperson_title:'Assoc. Prof.',chairperson_name:'Paul Rodolf P. Castor '.repeat(4).slice(0,80)};
 const {writeFile}=await import('node:fs/promises');
 for(const format of ['docx','pdf']){
  const bytes=await generateDocument({templateId:t.id,values:long,format,manifest,templateBytes:await readFile(path.join(root,t[format])),fontBytes:await readFile(path.join(root,t.font)),boldFontBytes:await readFile(path.join(root,t.boldFont))});
  await writeFile(path.resolve(root,'../autofill-work/qa-generated/endorsement-long.'+format),bytes);
  if(format==='pdf'){const pdf=await PDFDocument.load(bytes);assert.ok(pdf.getPageCount()>=1&&pdf.getPageCount()<=3,'bounded long-value letter must paginate without excessive pages');assert.equal(pdf.getForm().getFields().length,0);}
 }
});
