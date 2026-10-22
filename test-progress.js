(()=>{
function starProgress({step,completion=[],openedSteps=[],submissions=[],userId}={}){
 const completed=completion.some(c=>typeof c==='string'?c===step:c.step===step&&(!userId||c.user_id===userId)&&c.complete!==0);
 if(completed)return {stars:3,status:'completed',label:'Completed'};
 const rows=submissions.filter(r=>r.step===step&&r.status!=='superseded'&&(!userId||r.user_id===userId));
 if(rows.length){const status=rows.some(r=>r.status==='revision')?'revision':rows.every(r=>r.status==='approved')?'ready':'submitted';return {stars:2,status,label:status==='revision'?'Needs revision':status==='ready'?'Files approved; awaiting step completion':'Awaiting review'};}
 const opened=openedSteps.some(s=>typeof s==='string'?s===step:s.step===step&&(!userId||s.user_id===userId));
 return opened?{stars:1,status:'opened',label:'Opened; submission pending'}:{stars:0,status:'not-started',label:'Not opened yet'};
}
let starSequence=0;
function paintStarProgress(button,progress,{animate=false,title}={}){
 button.querySelector('.step-progress')?.remove();const previous=button.querySelector('.level-stars');const oldCount=previous?Number(previous.dataset.count):progress.stars;previous?.remove();
 const row=document.createElement('span');row.className='level-stars';row.dataset.count=String(progress.stars);row.setAttribute('aria-hidden','true');
 const ns='http://www.w3.org/2000/svg';
 for(let i=0;i<3;i++){
  const slot=document.createElement('span');slot.className='level-star'+(i<progress.stars?' is-earned':'')+(animate&&i>=oldCount&&i<progress.stars?' just-earned':'');
  const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 40 40');svg.setAttribute('focusable','false');
  const defs=document.createElementNS(ns,'defs'),gradient=document.createElementNS(ns,'linearGradient'),id='star-gold-'+(++starSequence);gradient.id=id;gradient.setAttribute('x2','0');gradient.setAttribute('y2','1');
  for(const [offset,color] of [['0%','#fff5b0'],['42%','#ffdc5e'],['100%','#dfa036']]){const stop=document.createElementNS(ns,'stop');stop.setAttribute('offset',offset);stop.setAttribute('stop-color',color);gradient.append(stop);}defs.append(gradient);svg.append(defs);
  const shape=document.createElementNS(ns,'path');shape.setAttribute('d','M20 3.8 25.1 13.9 36.4 15.5 28.2 23.4 30.2 34.6 20 29.3 9.8 34.6 11.8 23.4 3.6 15.5 14.9 13.9Z');shape.setAttribute('stroke-linejoin','round');shape.setAttribute('stroke-width','2.2');shape.setAttribute('stroke',i<progress.stars?'#9d6325':'#947b52');shape.setAttribute('fill',i<progress.stars?'url(#'+id+')':'#f0dfb8');svg.append(shape);
  if(i<progress.stars){const shine=document.createElementNS(ns,'path');shine.setAttribute('d','M20 8.5 23.4 15.3 31 16.4');shine.setAttribute('fill','none');shine.setAttribute('stroke','#fff8d0');shine.setAttribute('stroke-width','2');shine.setAttribute('stroke-linecap','round');shine.setAttribute('stroke-linejoin','round');svg.append(shine);}
  slot.append(svg);row.append(slot);
 }
 const name=button.querySelector('.level-name');button.insertBefore(row,name||null);button.classList.add('has-level-stars');button.setAttribute('aria-label',(title||name?.textContent||'Level')+': '+progress.stars+' of 3 stars. '+progress.label);button.title=progress.stars+' of 3 stars · '+progress.label;
}
function ensureStarLegend(){
 if(document.getElementById('star-legend'))return;
 const legend=document.createElement('p');legend.id='star-legend';legend.className='star-legend';legend.textContent='Stars: 0 not opened · 1 opened, submission pending · 2 submitted, review or revision pending · 3 coordinator-confirmed complete';
 document.querySelector('.level-map')?.after(legend);
}


const config=window.OJT_RESOURCES;
const key='bsca-sojt-public-demo-stars-v1';
let values={};let storageAvailable=true;
try{const saved=JSON.parse(localStorage.getItem(key)||'{}');for(const s of config.steps)if(Number.isInteger(saved[s.id])&&saved[s.id]>=0&&saved[s.id]<=3)values[s.id]=saved[s.id];}catch{storageAvailable=false;}
const make=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const panel=make('section',undefined,'account-panel public-demo-panel');panel.append(make('h2','Public test portal'),make('p','No login or school-email restriction. Stars are a browser-only demonstration and are not official submission or approval records. Google Forms keep their own access settings.'));
const count=make('p','','demo-count');count.setAttribute('role','status');const reset=make('button','Reset demo progress','quiet');reset.type='button';panel.append(count,reset);document.querySelector('.resource-intro').after(panel);
const state=stars=>({stars,label:['Not opened yet','Opened; submission pending','Demo: review or corrections pending','Demo: completed'][stars]});
function save(){try{localStorage.setItem(key,JSON.stringify(values));storageAvailable=true;}catch{storageAvailable=false;}}
function paint(animateStep){for(const s of config.steps){const b=document.getElementById('level-'+s.id);if(b)paintStarProgress(b,state(values[s.id]||0),{title:s.title,animate:s.id===animateStep});}ensureStarLegend();document.getElementById('star-legend').textContent='DEMO STARS: 0 unopened · 1 opened · 2 simulated submission/revision · 3 simulated completion';count.textContent=Object.values(values).filter(v=>v===3).length+' / '+config.steps.length+' steps previewed as complete. '+(storageAvailable?'Demo progress is saved only in this browser.':'Browser storage is unavailable; demo progress resets when this page reloads.');}
reset.onclick=()=>{values={};save();paint();};
let active;
function showDemoControls(){const dialog=document.getElementById('level-dialog');if(!dialog.open){active=undefined;return;}const number=Number(document.getElementById('level-label').textContent.match(/STEP (\d+)/)?.[1]);const step=config.steps[number-1];if(!step)return;active=step.id;if(!values[active]){values[active]=1;save();paint(active);}
const host=document.getElementById('level-content');host.querySelector('.demo-controls')?.remove();const section=make('section',undefined,'account-panel demo-controls');section.append(make('h3','Test the star display'),make('p','For visual testing only. Changing this selection does not submit a document or approve a requirement. Opening a Google Form does not verify submission.'));
const label=make('label','Preview progress'),select=make('select');for(const [v,text]of [[1,'1 star — opened, submission pending'],[2,'2 stars — simulate pending review / revision'],[3,'3 stars — simulate completed']]){const option=make('option',text);option.value=String(v);select.append(option);}select.value=String(values[active]);label.append(select);const form=make('div',undefined,'account-form');form.append(label);section.append(form);const stepId=active;select.onchange=()=>{values[stepId]=Number(select.value);save();paint(stepId);};host.append(section);}
const observer=new MutationObserver(showDemoControls);observer.observe(document.getElementById('level-label'),{childList:true});observer.observe(document.getElementById('level-dialog'),{attributes:true,attributeFilter:['open']});paint();showDemoControls();
})();
