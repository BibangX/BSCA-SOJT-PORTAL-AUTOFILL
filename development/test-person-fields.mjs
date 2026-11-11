import test from 'node:test';
import assert from 'node:assert/strict';
import {people,personDisplayKeys} from '../person-fields.js';
import {readFile} from 'node:fs/promises';
const manifest=JSON.parse(await readFile(new URL('../templates/autofill/manifest.json',import.meta.url)));
test('every person has one canonical name and pronoun pair',()=>{
 assert.equal(people.length,9);assert.equal(new Set(people.map(p=>p.name)).size,9);assert.equal(new Set(people.map(p=>p.pronouns)).size,9);
 for(const p of people){assert(manifest.fields[p.name]);assert.deepEqual(manifest.fields[p.pronouns].options,['he/him','she/her','they/them']);}
});
test('each visible person gets pronouns once without changing document requirements',()=>{
 for(const t of manifest.templates){const keys=personDisplayKeys(t.fields);assert.equal(keys.length,new Set(keys).size);for(const p of people)if(t.fields.includes(p.name))assert(keys.includes(p.pronouns));}
 assert.deepEqual(personDisplayKeys(['company_name']),['company_name']);
});
test('additional trainees retain separate pronoun choices',()=>{
 const keys=personDisplayKeys(['additional_student_2','additional_student_3']);assert(keys.includes('additional_student_2_pronouns'));assert(keys.includes('additional_student_3_pronouns'));
 for(const p of people.filter(p=>!['dean_name','recipient_name'].includes(p.name)))assert.equal(manifest.fields[p.pronouns].required,false);
});
