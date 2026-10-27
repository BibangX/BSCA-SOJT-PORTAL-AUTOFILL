export const applicationStatuses=['Not applied yet','Awaiting response','Accepted','Not proceeding'];
export function workflowProgress(step, values, confirmed){
 if(!confirmed)return {stars:Object.values(values).some(v=>String(v).trim())?2:1,label:'Draft — confirm your information'};
 if(step==='company'&&values.application_status!=='Accepted')return {stars:2,label:values.application_status==='Not proceeding'?'Choose another company':values.application_status};
 return {stars:3,label:'Information confirmed locally — not coordinator approval'};
}
export function companyKeys(fields,status){return fields.filter(k=>!['student_full_name','student_number'].includes(k)&&(k!=='acceptance_link'||status==='Accepted'));}
