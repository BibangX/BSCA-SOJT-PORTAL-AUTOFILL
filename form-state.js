import {people} from './person-fields.js';
export const durationKeys=['_waiver_auto_duration','_waiver_date_basis'];
export function dateBasis(values){return [values.start_date||'',values.end_date||''].join('|');}
export function trainingDuration(values){
 const dates=[values.start_date,values.end_date];
 if(!dates.every(v=>/^\d{4}-\d{2}-\d{2}$/.test(v||'')&&!Number.isNaN(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v)||dates[1]<dates[0])return '';
 const format=new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'});
 return dates.map(v=>format.format(new Date(v+'T00:00:00Z'))).join(' to ');
}
export function syncDuration(values){
 const duration=trainingDuration(values),basis=dateBasis(values);
 const automatic=values._waiver_auto_duration==='yes';
 if(automatic||!values.waiver_duration?.trim()){
  values.waiver_duration=duration;values._waiver_auto_duration='yes';values._waiver_date_basis=basis;
  return {manual:false,needsReview:false};
 }
 return {manual:true,needsReview:values._waiver_date_basis!==basis};
}
export function updateSharedField(values,key,value){
 const person=people.find(p=>p.name===key);
 let reset='';
 if(person&&values[key]?.trim()!==value.trim()&&values[person.pronouns]){delete values[person.pronouns];reset=person.pronouns;}
 values[key]=value;
 if(key==='waiver_duration'){values._waiver_auto_duration='no';values._waiver_date_basis=dateBasis(values);}
 if(key==='start_date'||key==='end_date')syncDuration(values);
 return reset;
}
