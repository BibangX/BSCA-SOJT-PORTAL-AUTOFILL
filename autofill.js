import {applicationStatuses,workflowProgress,companyKeys} from './workflow-model.js';
/* Browser-only document preparation. No student details are sent to a server. */
const manifestUrl = new URL('./templates/autofill/manifest.json', import.meta.url);
const storageKey = 'bsca-sojt-document-details-v1';
const supportedSteps = new Set(['intent', 'company', 'endorsement', 'moa', 'preparation']);
const documentViews={endorsement:{id:'endorsement',heading:'Create your endorsement letter',action:'Prefill my letter →',blank:'endorsement-letter.docx'},moa:{id:'moa',heading:'Create your MOA',action:'Prefill my MOA →',blank:'moa.docx'},preparation:{id:'waiver',heading:'Prepare the optional liability waiver',action:'Prefill my waiver →',blank:'liability-waiver.docx'}};
const state = {manifest:null, values:{}, remember:false, storageMessage:'', loading:null};
const confirmations={};
const workflowKeys=['application_status','company_source'];
const views = new Map();
const node = (tag, text, cls) => {const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const getFields = () => state.manifest?.fields || {};
const templateStep = t => t.step || t.stepId;
const templateLabel = t => t.label || t.title || 'Document';
const fieldLabel = key => getFields()[key]?.label || key.replaceAll('_',' ');
const textLimit = key => Math.min(Number(getFields()[key]?.maxLength)||250, 3000);
function storageAvailable(action){try{return action(window.localStorage);}catch{return undefined;}}
function removeRemembered(){try{window.localStorage.removeItem(storageKey);return true;}catch{return false;}}
function saveRemembered(){
 if(!state.remember)return;
 try{window.localStorage.setItem(storageKey, JSON.stringify({version:1,values:state.values,confirmations}));state.storageMessage='Details are saved on this browser. Use Clear saved details on a shared device.';}
 catch{state.remember=false;state.storageMessage='This browser could not save details. They remain available only in this tab.';}
}
function loadRemembered(){
 const raw=storageAvailable(s=>s.getItem(storageKey));if(!raw)return;
 try{if(raw.length>30000)throw Error();const saved=JSON.parse(raw);if(saved.version!==1||!saved.values||Array.isArray(saved.values)||typeof saved.values!=='object')throw Error();
 const clean={};for(const key of [...Object.keys(getFields()),...workflowKeys]){const value=saved.values[key];if(typeof value==='string'&&value.length<=textLimit(key))clean[key]=value;}
 state.values=clean;Object.assign(confirmations,saved.confirmations||{});state.remember=true;state.storageMessage='Saved details from this browser have been loaded. Check that they belong to you.';
 }catch{storageAvailable(s=>s.removeItem(storageKey));state.storageMessage='An older saved draft could not be loaded. Please enter your details again.';}
}
async function loadManifest(){
 if(state.loading)return state.loading;
 state.loading=(async()=>{const response=await fetch(manifestUrl);if(!response.ok)throw Error('The document forms could not load. Check your connection and try again.');const manifest=await response.json();
 if(!manifest||!Array.isArray(manifest.templates)||!manifest.fields||Array.isArray(manifest.fields))throw Error('The document form configuration is unavailable. Please contact the coordinator.');
 for(const t of manifest.templates){if(!t.id||!Array.isArray(t.fields)||t.fields.some(key=>!manifest.fields[key]))throw Error('The document form configuration is incomplete. Please contact the coordinator.');}
 state.manifest=manifest;loadRemembered();return manifest;
 })();try{return await state.loading;}finally{state.loading=null;}
}
function currentArticle(){return document.querySelector('#level-content > .resource-step') || document.querySelector('#level-content .resource-step');}
function mount(){
 const article=currentArticle();if(!article||!supportedSteps.has(article.id))return;
 let view=views.get(article.id);if(!view){view=createView(article);views.set(article.id,view);}
 view.sync();
}
function createView(article){
 const workflow=['intent','company'].includes(article.id);
 const documentView=documentViews[article.id];
 const prepareLabel=workflow?'Open information form':documentView.action;
 const section=node('section',undefined,'autofill-panel');section.setAttribute('aria-labelledby','autofill-heading-'+article.id);
 const heading=node('h4',workflow?(article.id==='intent'?'Your information and intent':'Your company application'):documentView.heading);heading.id='autofill-heading-'+article.id;
 const intro=node('p','Recommended: use your saved Level 1 and 2 details, complete the remaining fields, then review and download your filled Word or PDF. Signatures and official approval sections stay blank.','autofill-intro');
 if(workflow){intro.textContent='Save a draft anytime, then confirm complete information. Details are reused in later documents. This public portal saves only in this tab unless you enable device saving.';article.querySelector('.resource-submit')?.remove();article.querySelector('.resource-step-actions')?.remove();}
 const prepare=node('button',prepareLabel,'resource-action');prepare.type='button';prepare.setAttribute('aria-expanded','false');prepare.setAttribute('aria-controls','autofill-editor-'+article.id);
 const editor=node('div',undefined,'autofill-editor');editor.id='autofill-editor-'+article.id;editor.hidden=true;
 const status=node('p','','autofill-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 section.append(heading,intro,prepare,editor,status);
 if(article.id==='preparation'){intro.textContent='Use this only if the coordinator confirms a liability waiver is required. It does not replace parent or guardian consent or medical clearance. Prefill uses saved student and dean details; signatures and notarial entries stay blank.';}
 else if(article.id==='moa'){intro.textContent='Reuse saved company, student and institutional details. Add additional students only when the same MOA covers them. Review, download, and arrange the required signatures and notarization separately.';}
 const body=article.querySelector('.resource-step-body'),submit=article.querySelector('.resource-submit');
 if(!workflow){
  body?.classList.add('autofill-guided-layout');
  section.prepend(node('p','1 · FILL DETAILS   →   2 · REVIEW   →   3 · DOWNLOAD','autofill-route'));
  const materials=article.querySelector('.resource-step-actions');
  const alternative=node('details',undefined,'autofill-manual');
  alternative.append(node('summary','Prefer to fill it manually? Download the blank template'));
  alternative.append(node('p','Optional alternative: this Word template has empty placeholders. Fill every required detail yourself before printing and signing.','template-note'));
  if(materials){
   const mapped=[...materials.querySelectorAll('a[download]')].find(link=>link.getAttribute('href')?.split('/').pop()===documentView.blank);
   if(mapped){const oldNote=mapped.nextElementSibling;mapped.textContent='Download blank Word template';alternative.append(mapped);if(oldNote?.classList.contains('template-note'))oldNote.remove();}
   if(materials.querySelector('a[download]')){materials.classList.add('autofill-other-materials');const title=materials.querySelector('h4');if(title)title.textContent=article.id==='preparation'?'Other pre-deployment requirements':'Internship plan';materials.append(node('p','These documents do not have prefill available yet. Download the template and complete it as instructed.','template-note'));}
   else materials.remove();
  }
  section.append(alternative);
 }
 const remainingMaterials=article.querySelector('.autofill-other-materials');
 (body||article).append(section);if(remainingMaterials)(body||article).append(remainingMaterials);
 if(submit){submit.classList.add('autofill-submit');if(!workflow){submit.prepend(node('h4','After downloading: sign and submit'));submit.prepend(node('p','Finish your document','autofill-route'));} (body||article).append(submit);}
 let built=false, expanded=false, busy=false, template, form, preview, controls=[],rememberInput, storageNote, extraStudents=0;
 function setStatus(message){status.textContent=message;}
 function invalidate(){if(preview)preview.hidden=true;}
 function progress(){if(!workflow)return;const result=workflowProgress(article.id,state.values,confirmations[article.id]);window.dispatchEvent(new CustomEvent('sojt-workflow-progress',{detail:{step:article.id,...result}}));}
 function changed(key){
  const affected=new Set();
  if(key){for(const id of ['intent','company'])if(state.manifest?.templates.find(t=>t.id===id)?.fields.includes(key))affected.add(id);}
  else if(workflow)affected.add(article.id);
  for(const id of affected){confirmations[id]=false;const result=workflowProgress(id,state.values,false);window.dispatchEvent(new CustomEvent('sojt-workflow-progress',{detail:{step:id,...result}}));}
  progress();
 }
 function seedWaiverDuration(){
  if(template?.id!=='waiver'||state.values.waiver_duration?.trim())return;
  const dates=[state.values.start_date,state.values.end_date];
  if(!dates.every(value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')&&!Number.isNaN(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value)||dates[1]<dates[0])return;
  const format=new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'});
  state.values.waiver_duration=dates.map(value=>format.format(new Date(value+'T00:00:00Z'))).join(' to ');saveRemembered();
 }

 function updateStorageUi(){if(rememberInput)rememberInput.checked=state.remember;if(storageNote)storageNote.textContent=state.storageMessage||'Leaving this page clears unsaved details. Shared computers should keep this option off.';}
 function updateValues(){seedWaiverDuration();for(const [key,input]of controls){if(input!==document.activeElement)input.value=state.values[key]||'';}updateStorageUi();invalidate();}
 function getTemplate(){return state.manifest?.templates.find(t=>workflow?templateStep(t)===article.id:t.id===documentView.id);}
 function build(){
  template=getTemplate();editor.replaceChildren();controls=[];
  if(!template){editor.append(node('p','Autofill is not available for this document yet. You can still download the blank template below.'));return;}
  seedWaiverDuration();
  editor.append(node('p',templateLabel(template),'autofill-document-title'));
  if(template.fields.includes('dean_name'))editor.append(node('p','Institutional names and designations are reused across these documents. Select the designation separately (including Atty.); enter the name without repeating its title. Confirm the current signatories with the department.','autofill-storage-note'));
  const templateNote=template.note||((template.status==='approved')?'':'Prepared sample for coordinator review. Confirm the wording before official use.');if(templateNote&&!workflow)editor.append(node('p',templateNote,'autofill-template-note'));
  form=node('form',undefined,'autofill-form');form.noValidate=false;
  const fields=node('div',undefined,'autofill-fields');
  const additionalLabels=[];
  extraStudents=state.values.additional_student_3?2:state.values.additional_student_2?Math.max(extraStudents,1):extraStudents;
  const seenGroups=new Set();
  const displayKeys=workflow&&article.id==='company'?companyKeys(template.fields,state.values.application_status):template.fields;
  if(workflow&&article.id==='company'){
   const sourceLabel=node('label','Company selection','autofill-field');const source=node('select');source.append(new Option('Enter a new company','new'));for(const c of window.OJT_RESOURCES.companies)source.append(new Option(c.name,c.name));source.value=state.values.company_source||'new';sourceLabel.append(source);fields.append(sourceLabel);
   source.onchange=()=>{const previous=state.values.company_name;if(previous&&source.value!==previous&&!window.confirm('Change company? Existing downloaded and submitted documents stay unchanged. Review or regenerate them for the new company.')){source.value=state.values.company_source||'new';return;}state.values.company_source=source.value;for(const k of template.fields)if(!['student_full_name','student_number'].includes(k))delete state.values[k];const c=window.OJT_RESOURCES.companies.find(c=>c.name===source.value);if(c){state.values.company_name=c.name;state.values.company_address=c.location||'';state.values.recipient_name=c.contact||'';state.values.company_email=c.email||'';state.values.company_phone=c.phone||'';}changed();saveRemembered();build();};
   const statusLabel=node('label','Application status','autofill-field');const statusSelect=node('select');statusSelect.append(new Option('Choose application status',''));for(const value of applicationStatuses)statusSelect.append(new Option(value,value));statusSelect.value=state.values.application_status||'';statusSelect.required=true;statusLabel.append(statusSelect);fields.append(statusLabel);statusSelect.onchange=()=>{state.values.application_status=statusSelect.value;changed();saveRemembered();build();};
   editor.append(node('p','Accepted describes the company’s response, not deployment approval. Changing company details may require regenerating documents.','autofill-template-note'));
  }
  const groupedKeys=[...new Set(displayKeys.map(key=>getFields()[key].group||''))].flatMap(group=>displayKeys.filter(key=>(getFields()[key].group||'')===group));
  for(const key of groupedKeys){
   const meta=getFields()[key];const group=meta.group||'';
   if(group&&!seenGroups.has(group)){fields.append(node('h5',group,'autofill-group'));seenGroups.add(group);}
   const label=node('label',undefined,'autofill-field');label.append(node('span',fieldLabel(key)+(meta.required===false?' (optional)':' *')));
   let input;
   if(Array.isArray(meta.options)&&meta.options.length){input=node('select');const empty=node('option','Choose an option');empty.value='';input.append(empty);for(const item of meta.options){const option=node('option',typeof item==='string'?item:item.label);option.value=typeof item==='string'?item:item.value;input.append(option);}}
   else if(meta.type==='textarea'){input=node('textarea');input.rows=3;input.maxLength=textLimit(key);label.classList.add('autofill-field-wide');}
   else{input=node('input');input.type=['date','month','email','tel','number','url'].includes(meta.type)?meta.type:'text';if(input.type!=='number')input.maxLength=textLimit(key);if(meta.type==='number'){input.min=String(meta.min??0);input.max=String(meta.max??10000);input.step=String(meta.step??1);}}
   input.name=key;input.id='autofill-'+article.id+'-'+key;input.required=meta.required!==false;if(workflow&&article.id==='company'&&state.values.application_status!=='Accepted')input.required=key==='company_name';input.value=state.values[key]||'';input.autocomplete='off';
   if(meta.pattern)input.pattern=meta.pattern;if(meta.placeholder)input.placeholder=meta.placeholder;else if(key==='event_title')input.placeholder='e.g. Supervised On-the-Job Training';
   input.addEventListener('input',()=>{state.values[key]=input.value;changed(key);input.setCustomValidity('');invalidate();saveRemembered();updateStorageUi();setStatus('Draft updated. Review your details before downloading.');});
   input.addEventListener('change',()=>{state.values[key]=input.value;changed(key);input.setCustomValidity('');invalidate();saveRemembered();updateStorageUi();});
   label.append(input);
   if(meta.help){const help=node('small',meta.help);help.id=input.id+'-help';input.setAttribute('aria-describedby',help.id);label.append(help);}
   controls.push([key,input]);fields.append(label);
   if(['additional_student_2','additional_student_3'].includes(key)){const ordinal=key==='additional_student_2'?1:2;additionalLabels.push({ordinal,label,input,key});label.hidden=ordinal>extraStudents;}
  }
  if(template.id==='moa'&&additionalLabels.length){
   const studentActions=node('div',undefined,'autofill-buttons autofill-field-wide');const add=node('button','Add another student','resource-action secondary'),remove=node('button','Remove last additional student','resource-action secondary');add.type=remove.type='button';
   function syncStudents(){for(const item of additionalLabels)item.label.hidden=item.ordinal>extraStudents;add.disabled=extraStudents>=additionalLabels.length;remove.hidden=extraStudents===0;}
   add.onclick=()=>{extraStudents=Math.min(additionalLabels.length,extraStudents+1);syncStudents();invalidate();additionalLabels.find(item=>item.ordinal===extraStudents)?.input.focus();};
   remove.onclick=()=>{const item=additionalLabels.find(item=>item.ordinal===extraStudents);if(item){item.input.value='';delete state.values[item.key];}extraStudents=Math.max(0,extraStudents-1);syncStudents();changed(item?.key);invalidate();saveRemembered();updateStorageUi();};
   studentActions.append(add,remove);fields.append(studentActions,node('small','One primary student plus up to two additional students. Add only students covered by this agreement.','autofill-field-wide'));syncStudents();
  }
  form.append(fields,node('p','* Required for this document. Saved details are shared across document forms; changes will be reused in later downloads.','autofill-required-note'));
  if(template.id==='waiver'){const requiredLabel=node('label',undefined,'autofill-remember autofill-waiver-confirm');const requiredInput=node('input');requiredInput.type='checkbox';requiredInput.required=true;requiredLabel.append(requiredInput,node('span','The coordinator has confirmed that this liability waiver is required for my activity. It does not replace parent or guardian consent.'));form.append(requiredLabel);}

  const rememberLabel=node('label',undefined,'autofill-remember');rememberInput=node('input');rememberInput.type='checkbox';rememberInput.checked=state.remember;rememberLabel.append(rememberInput,node('span','Remember my details on this device'));
  storageNote=node('p','','autofill-storage-note');rememberInput.addEventListener('change',()=>{state.remember=rememberInput.checked;if(state.remember)saveRemembered();else{const removed=removeRemembered();state.storageMessage=removed?'Device saving is off. Your current draft remains in this tab.':'Device saving is off for this tab, but browser storage could not be cleared. Clear this site’s saved data in your browser settings.';}updateStorageUi();});
  const privacy=node('p','Document preparation happens in your browser. This form does not submit your information to the coordinator. Upload and submit the finished file separately using the submission instructions.','autofill-privacy');
  const buttons=node('div',undefined,'autofill-buttons');const review=node('button','Review details','resource-action');review.type='submit';const clear=node('button','Clear all details','resource-action secondary');clear.type='button';clear.addEventListener('click',()=>{if(busy)return;if(!window.confirm('Clear the details entered in all document forms and remove this portal’s saved details from this browser? Downloaded files and Google Forms responses are not deleted.'))return;state.values={};for(const k of Object.keys(confirmations))delete confirmations[k];state.remember=false;window.dispatchEvent(new CustomEvent('sojt-workflow-reset'));const removed=removeRemembered();state.storageMessage=removed?'Document form details cleared from this tab and browser.':'Details cleared from this tab, but saved browser data could not be removed. Clear this site’s data in browser settings.';extraStudents=0;for(const view of views.values())view.sync();if(template?.id==='moa')build();setStatus(state.storageMessage);});if(workflow){review.textContent='Confirm information';const draft=node('button','Save draft','resource-action secondary');draft.type='button';draft.onclick=()=>{changed();saveRemembered();updateStorageUi();setStatus(state.remember?'Draft saved on this browser.':'Draft kept in this tab. Enable device saving to keep it after closing.');};buttons.append(draft);}buttons.append(review,clear);
  form.append(rememberLabel,storageNote,privacy,buttons);editor.append(form);
  preview=node('section',undefined,'autofill-review');preview.hidden=true;preview.setAttribute('aria-label','Review document details');editor.append(preview);
  form.addEventListener('submit',async e=>{e.preventDefault();if(busy)return;for(const [,input]of controls)input.setCustomValidity('');
   for(const [key,input]of controls){const trimmed=input.value.trim();state.values[key]=trimmed;if(input.required&&!trimmed)input.setCustomValidity('Enter '+fieldLabel(key).toLowerCase()+'.');}
   const start=controls.find(([key])=>key==='start_date')?.[1],end=controls.find(([key])=>key==='end_date')?.[1];if(start?.value&&end?.value&&end.value<start.value)end.setCustomValidity('End date must be on or after the start date.');
   if(!form.reportValidity())return;
   busy=true;review.disabled=true;section.setAttribute('aria-busy','true');setStatus('Checking your document details…');
   try{const {validateValues}=await import('./autofill-engine.js');if(workflow){if(article.id==='intent')validateValues(template.id,state.values,state.manifest);else {if(!applicationStatuses.includes(state.values.application_status))throw Error('Choose an application status.');const manifest=structuredClone(state.manifest);const t=manifest.templates.find(t=>t.id===template.id);t.fields=companyKeys(t.fields,state.values.application_status);if(state.values.application_status!=='Accepted')for(const key of t.fields)if(key!=='company_name')manifest.fields[key].required=false;validateValues(template.id,state.values,manifest);}confirmations[article.id]=true;saveRemembered();updateStorageUi();progress();setStatus('Information confirmed '+(state.remember?'on this browser':'for this tab')+'. No information was sent to the coordinator.');}else{validateValues(template.id,state.values,state.manifest);saveRemembered();updateStorageUi();showReview();}}
   catch(error){setStatus('Please check your details. '+(error?.message||'The document could not be checked. Try again.'));}
   finally{busy=false;review.disabled=false;section.removeAttribute('aria-busy');}
  });
  built=true;updateStorageUi();
 }
 function showReview(){
  preview.replaceChildren(node('h5','Check before downloading'));
  const list=node('dl',undefined,'autofill-review-list');const snapshot={};for(const key of template.fields){snapshot[key]=(state.values[key]||(getFields()[key]?.fallback?state.values[getFields()[key].fallback]:'')||'').trim();list.append(node('dt',fieldLabel(key)),node('dd',snapshot[key]||'Not provided'));}snapshot.student_number=state.values.student_number||snapshot.student_number||'';preview.append(list);
  preview.append(node('p','Check names, dates and company details carefully. Downloading does not count as submission, approval or completed training.','autofill-review-note'));
  const confirmation=node('label',undefined,'autofill-remember');const checked=node('input');checked.type='checkbox';confirmation.append(checked,node('span','I have checked these details and understand that signatures and approvals must be completed separately.'));preview.append(confirmation);
  const buttons=node('div',undefined,'autofill-buttons');const downloadButtons=[];
  for(const format of template.formats||['docx','pdf']){if(!['docx','pdf'].includes(format))continue;const download=node('button',format==='docx'?'Download Word':'Download PDF','resource-action');download.type='button';download.disabled=true;downloadButtons.push(download);download.addEventListener('click',()=>{if(checked.checked)generate(snapshot,format);});buttons.append(download);}
  checked.addEventListener('change',()=>downloadButtons.forEach(b=>b.disabled=!checked.checked));
  const edit=node('button','Edit details','resource-action secondary');edit.type='button';edit.onclick=()=>{preview.hidden=true;controls[0]?.[1].focus();};buttons.append(edit);preview.append(buttons);preview.hidden=false;setStatus('Check the review confirmation, then choose Word or PDF to download.');preview.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
 }
 async function generate(snapshot,format){
  if(busy)return;busy=true;section.setAttribute('aria-busy','true');const allButtons=[...section.querySelectorAll('button,input,select,textarea')];const disabledStates=allButtons.map(e=>e.disabled);allButtons.forEach(e=>e.disabled=true);setStatus('Preparing your '+(format==='docx'?'Word document':'PDF')+'…');
  try{const {prepareDownload}=await import('./autofill-engine.js');const result=await prepareDownload(template.id,snapshot,format);const blob=result instanceof Blob?result:result.blob;if(!(blob instanceof Blob)||!blob.size)throw Error('No document was generated. Please try again.');const filename=result.filename||'SOJT-'+template.id+'.'+format;
   const url=URL.createObjectURL(blob);const link=node('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);setStatus('Your '+(format==='docx'?'Word document':'PDF')+' is ready. Check your browser’s downloads. Complete any required signatures before submission.');
  }catch(error){setStatus('Could not prepare the document. '+(error?.message||'Check your connection and try again.'));}
  finally{busy=false;section.removeAttribute('aria-busy');allButtons.forEach((e,i)=>e.disabled=disabledStates[i]);}
 }
 async function open(){
  expanded=!expanded;prepare.setAttribute('aria-expanded',String(expanded));prepare.textContent=expanded?'Hide form':prepareLabel;editor.hidden=!expanded;if(!expanded)return;
  if(!state.manifest){setStatus('Loading document form…');try{await loadManifest();for(const view of views.values())view.sync();}catch(e){setStatus(e.message+' Close and reopen the form to retry. The blank Word template is also available below.');return;}}
  if(!built)build();else updateValues();setStatus(workflow?'Save a partial draft or confirm complete information.':'Fill in the details below, then review your document.');progress();
 }
 prepare.addEventListener('click',open);
 return {sync(){if(busy)return;progress();if(state.manifest&&expanded&&!built)build();else if(built)updateValues();}};
}
const dialog=document.getElementById('level-dialog');const content=document.getElementById('level-content');
if(dialog&&content){const observer=new MutationObserver(mount);observer.observe(content,{childList:true});observer.observe(dialog,{attributes:true,attributeFilter:['open']});mount();}
