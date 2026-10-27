import test from 'node:test';
import assert from 'node:assert/strict';
import {workflowProgress,companyKeys,applicationStatuses} from '../workflow-model.js';
import {validateValues} from '../autofill-engine.js';
import fs from 'node:fs';
const manifest=JSON.parse(fs.readFileSync(new URL('../templates/autofill/manifest.json',import.meta.url)));
test('draft is not confirmed and pending applications cannot reach three stars',()=>{
 assert.equal(workflowProgress('intent',{},false).stars,1);
 assert.equal(workflowProgress('intent',{student_full_name:'Sample'},false).stars,2);
 for(const status of applicationStatuses.filter(s=>s!=='Accepted'))assert.equal(workflowProgress('company',{application_status:status},true).stars,2);
 assert.equal(workflowProgress('company',{application_status:'Accepted'},true).stars,3);
 assert.equal(workflowProgress('intent',{student_full_name:'Sample'},true).stars,3);
});
test('company workflow reuses identity and only requests acceptance evidence when accepted',()=>{
 const keys=manifest.templates.find(t=>t.id==='company').fields;
 assert(!companyKeys(keys,'Awaiting response').includes('acceptance_link'));
 assert(companyKeys(keys,'Accepted').includes('acceptance_link'));
 assert(!companyKeys(keys,'Accepted').includes('student_number'));
});
test('accepted company validation cannot pass missing evidence or a folder link',()=>{
 const m=structuredClone(manifest),t=m.templates.find(t=>t.id==='company');t.fields=companyKeys(t.fields,'Accepted');
 const values={company_name:'Sample',company_address:'Iligan City',recipient_name:'Sample Contact',recipient_title:'Manager',company_email:'contact@example.com',company_phone:'09123456789'};
 assert.throws(()=>validateValues('company',values,m));
 assert.throws(()=>validateValues('company',{...values,acceptance_link:'https://drive.google.com/drive/folders/example'},m));
});
