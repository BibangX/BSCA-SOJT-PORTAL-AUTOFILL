import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import {PDFDocument} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

const validDate = value => {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const d=new Date(value+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value&&Number(value.slice(0,4))>=1900&&Number(value.slice(0,4))<=2100;
};
export function validateValues(templateId, values, manifest){
 const template=manifest.templates.find(t=>t.id===templateId);
 if(!template)throw Error('Choose a supported document.');
 if(!values||typeof values!=='object'||Array.isArray(values))throw Error('Enter the document details.');
 const clean={};
 for(const key of template.fields){
  const rule=manifest.fields[key];if(!rule)throw Error('Document field configuration is incomplete.');
  const raw=values[key];if(raw!==undefined&&typeof raw!=='string'&&typeof raw!=='number')throw Error('Check '+rule.label+'.');
  const v=String(raw??'').trim().normalize('NFC');
  if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v))throw Error('Remove unsupported control characters from '+rule.label+'.');
  if(!v&&rule.required!==false)throw Error('Enter '+rule.label+'.');
  if(v.length>(rule.maxLength||200))throw Error(rule.label+' is too long.');
  if(v){
   if(rule.options){const allowed=rule.options.map(x=>typeof x==='object'?String(x.value):String(x));if(!allowed.includes(v))throw Error('Choose a valid '+rule.label+'.');}
   if(rule.pattern&&!new RegExp(rule.pattern).test(v))throw Error('Enter a valid '+rule.label+'.');
   if(key==='academic_year'){const [a,b]=v.split('-').map(Number);if(b!==a+1)throw Error('Academic year must contain consecutive years, for example 2026-2027.');}
   if(key==='acceptance_link'){let u;try{u=new URL(v);}catch{throw Error('Enter a direct Google Drive file link.');}if(u.protocol!=='https:'||u.hostname!=='drive.google.com'||u.username||u.password||!(/^\/file\/d\/[\w-]+(?:\/|$)/.test(u.pathname)||(u.pathname==='/open'&&/^[\w-]+$/.test(u.searchParams.get('id')||''))))throw Error('Enter a direct Google Drive file link, not a folder link.');}
   if(rule.type==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))throw Error('Enter a valid '+rule.label+'.');
   if(key==='school_email'&&!/^[^\s@]+@g\.msuiit\.edu\.ph$/i.test(v))throw Error('Use your @g.msuiit.edu.ph school email.');
   if(rule.type==='date'&&!validDate(v))throw Error('Enter a valid '+rule.label+'.');
   if(rule.type==='number'&&(!/^\d+$/.test(v)||Number(v)<(rule.min??0)||Number(v)>(rule.max??10000)))throw Error('Enter a valid '+rule.label+'.');
   if(rule.type==='url'){let u;try{u=new URL(v);}catch{throw Error('Enter a valid '+rule.label+'.');}if(u.protocol!=='https:'||u.username||u.password)throw Error('Use an HTTPS link for '+rule.label+'.');}
  }
  clean[key]=v;
 }
 if(clean.start_date&&clean.end_date&&clean.end_date<clean.start_date)throw Error('End date must be on or after the start date.');
 return clean;
}
export function downloadFilename(templateId,values,format){
 if(!['docx','pdf'].includes(format))throw Error('Choose Word or PDF.');
 const safe=v=>String(v||'').normalize('NFC').replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g,'_').replace(/\s+/g,'_').replace(/^\.+|\.+$/g,'').slice(0,70);
 return [safe(values.student_number)||'Student',safe(values.student_full_name)||'Document',safe(templateId)||'Template'].join('_')+'.'+format;
}
function displayValues(clean,manifest){
 return Object.fromEntries(Object.entries(clean).map(([key,v])=>[key,manifest.fields[key].type==='date'&&v?new Intl.DateTimeFormat('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(new Date(v+'T00:00:00Z')):v]));
}
function wrapLines(text,font,size,width){
 const lines=[];for(const paragraph of text.split('\n')){let line='';for(const word of paragraph.split(/\s+/)){if(font.widthOfTextAtSize(word,size)>width)return Infinity;const next=line?line+' '+word:word;if(font.widthOfTextAtSize(next,size)>width){lines.push(line);line=word;}else line=next;}lines.push(line);}return lines.length;
}
export async function generateDocument({templateId,values,format,manifest,templateBytes,fontBytes}){
 if(!['docx','pdf'].includes(format))throw Error('Choose Word or PDF.');
 const clean=validateValues(templateId,values,manifest),data=displayValues(clean,manifest);
 const template=manifest.templates.find(t=>t.id===templateId);
 if(format==='docx'){
  const zip=new PizZip(templateBytes);
  const doc=new Docxtemplater(zip,{paragraphLoop:true,linebreaks:true,nullGetter:()=>{throw Error('A document field is missing.');}});
  const expected=new Set(template.fields);
  // Masters are trusted, versioned assets; user values are rendered as escaped text.
  for(const key of Object.keys(data))if(!expected.has(key))throw Error('Unexpected document field.');
  doc.render(data);
  return doc.getZip().generate({type:'uint8array',compression:'DEFLATE'});
 }
 if(!fontBytes)throw Error('The document font could not be loaded. Please retry.');
 const face=fontkit.create(fontBytes);for(const value of Object.values(data))for(const char of value){if(!/\s/.test(char)&&!face.hasGlyphForCodePoint(char.codePointAt(0)))throw Error('The PDF print font does not support a character in your details. Download Word to preserve it.');}
 const pdf=await PDFDocument.load(templateBytes);pdf.registerFontkit(fontkit);
 const font=await pdf.embedFont(fontBytes,{subset:true});const form=pdf.getForm();
 const actual=new Set(form.getFields().map(f=>f.getName()));
 for(const key of template.fields){
  if(!actual.has(key))throw Error('PDF template is missing '+key+'.');
  const field=form.getTextField(key),value=data[key];const widgets=field.acroField.getWidgets();
  let size=11;
  for(const widget of widgets){const rect=widget.getRectangle();const width=rect.width-8,height=rect.height-6;
   while(size>=9){const fits=field.isMultiline()?wrapLines(value,font,size,width)*size*1.25<=height:!value.includes('\n')&&font.widthOfTextAtSize(value,size)<=width;if(fits)break;size-=.5;}
   if(size<9)throw Error(manifest.fields[key].label+' does not fit the PDF. Shorten it or download Word to adjust the layout.');
  }
  field.setMaxLength(undefined);field.setText(value);field.setFontSize(size);
 }
 form.updateFieldAppearances(font);form.flatten();
 pdf.setTitle(template.title||template.label||templateId);pdf.setAuthor('');pdf.setSubject('SOJT document prepared from student-entered details');
 return pdf.save({useObjectStreams:false});
}
let manifestPromise;
export async function getManifest(){
 if(!manifestPromise)manifestPromise=fetch(new URL('./templates/autofill/manifest.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Document forms could not load. Refresh and retry.');return r.json();}).catch(e=>{manifestPromise=undefined;throw e;});
 return manifestPromise;
}
async function bytes(url){const r=await fetch(url);if(!r.ok)throw Error('A document resource could not load. Check your connection and retry.');return new Uint8Array(await r.arrayBuffer());}
export async function prepareDownload(templateId,values,format){
 if(!['docx','pdf'].includes(format))throw Error('Choose Word or PDF.');
 const manifest=await getManifest();validateValues(templateId,values,manifest);const t=manifest.templates.find(t=>t.id===templateId);
 const [templateBytes,fontBytes]=await Promise.all([bytes(new URL(t[format],import.meta.url)),format==='pdf'?bytes(new URL('./vendor/DejaVuSerif.ttf',import.meta.url)):Promise.resolve(null)]);
 let output;try{output=await generateDocument({templateId,values,format,manifest,templateBytes,fontBytes});}catch(e){if(e.message?.includes('fit')||e.message?.includes('print font')||e.message?.startsWith('Enter ')||e.message?.startsWith('Use '))throw e;throw Error('Could not prepare this file. Check your details and retry. '+(e.message?.includes('glyph')?'A character may not be supported by the print font.':''));}
 return {blob:new Blob([output],{type:format==='pdf'?'application/pdf':'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}),filename:downloadFilename(templateId,values,format)};
}
