const groups={
 Intent:['intent','intent-form'],CompanyInformation:['company','company-information-form'],Endorsement:['endorsement','endorsement-letter'],MOA:['moa'],LiabilityWaiver:['waiver','liability-waiver'],InternshipPlan:['internship-plan'],ParentOrGuardianConsent:['parent-or-guardian-consent'],MedicalClearance:['medical clearance'],MedicalClearanceGuide:['medical-clearance-guide'],SubmissionChecklist:['submission-checklist'],MonthlyReport:['monthly-report'],MonthlyLogbook:['monthly logbook','logbook'],FinalLogbook:['final logbook'],SupervisorEvaluation:['supervisor-evaluation'],CompletionChecklist:['completion-checklist'],CertificateOfCompletion:['certificate of completion'],CulminationPresentation:['culmination-presentation'],ClearanceRequestNote:['clearance-note','clearance request note'],ProgramOfStudy:['program of study'],AcceptanceEvidence:['acceptance evidence'],SignedDocument:['signed document for verification']};
const norm=x=>x.toLowerCase().replace(/[ -]/g,'');
const lookup=new Map(Object.entries(groups).flatMap(([token,keys])=>[token,...keys].map(k=>[norm(k),token])));
export function documentFilename(id,values,format,month=''){
 const token=lookup.get(norm(id));if(!token||!['pdf','docx'].includes(format))throw Error('Unknown document type or format.');
 const safe=v=>String(v||'').normalize('NFC').trim().replace(/[<>:"/\\|?*\x00-\x1f\x7f]/g,'_').replace(/\s+/g,'_').replace(/^\.+|\.+$/g,'').slice(0,70);
 const number=safe(values.student_number),name=safe(values.student_full_name);if(!number||!name)throw Error('Enter your student number and full name in Level 1 before downloading.');
 const parts=[number,name,token];if(token.startsWith('Monthly')){if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw Error('Choose the reporting month before downloading.');parts.push(month);}
 return parts.join('_')+'.'+format;
}
