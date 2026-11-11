import test from 'node:test';
import assert from 'node:assert/strict';
import {syncDuration,updateSharedField,dateBasis} from '../form-state.js';
import {expandPronouns} from '../pronoun-values.js';
const dates=()=>({start_date:'2026-11-01',end_date:'2027-02-01'});
test('automatic duration tracks date edits and invalid dates clear it',()=>{
 const v=dates();syncDuration(v);assert.match(v.waiver_duration,/November 1/);
 updateSharedField(v,'start_date','2026-12-01');assert.match(v.waiver_duration,/December 1/);
 updateSharedField(v,'end_date','2026-01-01');assert.equal(v.waiver_duration,'');
});
test('manual duration survives date changes and requests review',()=>{
 const v=dates();updateSharedField(v,'waiver_duration','Two weeks');assert.equal(syncDuration(v).needsReview,false);
 updateSharedField(v,'end_date','2027-03-01');assert.equal(v.waiver_duration,'Two weeks');assert.equal(syncDuration(v).needsReview,true);
 v._waiver_date_basis=dateBasis(v);assert.equal(syncDuration(v).needsReview,false);
});
test('legacy custom duration is preserved and requires one review',()=>{
 const v={...dates(),waiver_duration:'Custom activity period'};assert.equal(syncDuration(v).needsReview,true);assert.equal(v.waiver_duration,'Custom activity period');
});
test('changed names reset only their associated pronouns',()=>{
 const v={dean_name:'Old Name',dean_pronouns:'he/him',student_pronouns:'she/her'};
 assert.equal(updateSharedField(v,'dean_name','New Name'),'dean_pronouns');assert.equal(v.dean_pronouns,undefined);assert.equal(v.student_pronouns,'she/her');
 v.dean_pronouns='they/them';updateSharedField(v,'dean_name','New Name ');assert.equal(v.dean_pronouns,'they/them');
});
test('pronoun forms cover subject object possessive and neutral wording',()=>{
 const d=expandPronouns({student_pronouns:'she/her',guardian_pronouns:'he/him',adviser_pronouns:''},{fields:{}});
 assert.equal(d.student_pronouns_subject,'she');assert.equal(d.guardian_pronouns_object,'him');assert.equal(d.student_pronouns_possessive_pronoun,'hers');assert.equal(d.adviser_pronouns,'their');
});
