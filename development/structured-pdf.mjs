import {PDFDocument} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

// A text-flow counterpart to the supplied DOCX masters: no boxes, flattened
// text, and no values manufactured for signatures or notarial particulars.
export async function generateStructuredPdf({template,data,templateBytes,fontBytes,boldFontBytes}){
 if(!fontBytes||!boldFontBytes)throw Error('The document fonts could not load. Please retry.');
 const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);
 const regular=await pdf.embedFont(fontBytes,{subset:true}),bold=await pdf.embedFont(boldFontBytes,{subset:true});
 const L=template.pdfLayout;let page,y;
 const background=templateBytes?await PDFDocument.load(templateBytes):null;
 async function newPage(){if(background){const [copy]=await pdf.copyPages(background,[0]);page=pdf.addPage(copy);}else page=pdf.addPage([L.width,L.height]);y=L.top;}
 await newPage();
 function resolve(text){
  // Process trusted master conditionals before inserting any student text.
  text=text.replace(/\{#([a-z_0-9]+)\}([\s\S]*?)\{\/\1\}/g,(_,key,body)=>data[key]?body:'');
  return text.replace(/\{([a-z_0-9]+)\}/g,(_,key)=>{if(!(key in data))throw Error('A document field is missing.');return data[key];});
 }
 function materialize(block){
  let runs=block.runs||[{text:block.text||'',bold:!!block.bold}];
  // Conditionals can span Word runs or paragraphs inside a signature cell.
  if(runs.some(r=>/[#\/][a-z_0-9]+\}/.test(r.text)))runs=[{text:runs.map(r=>r.text).join(''),bold:runs.some(r=>r.bold)}];
  return runs.map(r=>({text:resolve(r.text).replace(/\t/g,'    ').replace(/\u200b/g,''),bold:r.bold}));
 }
 function lines(block,width){
  const size=block.size||L.size;let result=[],line=[],used=0;
  const push=()=>{while(line.at(-1)?.space)used-=line.pop().width;result.push({items:line,width:used});line=[];used=0;};
  let first=true;
  for(const run of materialize(block))for(const token of run.text.match(/\n|[^\S\n]+|[^\s]+/g)||[]){
   if(token==='\n'){push();first=false;continue;}
   const space=/^\s+$/.test(token),value=space?' ':token,font=run.bold?bold:regular,w=font.widthOfTextAtSize(value,size);
   const available=width-(first?(block.firstIndent||0):0);
   if(w>available)throw Error('A value does not fit this PDF. Download Word to adjust it.');
   if(!space&&used+w>available&&line.length){push();first=false;}
   if(space&&!line.length)continue;
   line.push({value,font,width:w,space});used+=w;
  }
  if(line.length)push();return result;
 }
 function drawLine(line,block,x,width,top,index,last){
  const size=block.size||L.size,first=index===0?(block.firstIndent||0):0;
  x+=first;width-=first;
  if(block.align==='center')x+=(width-line.width)/2;
  if(block.align==='right')x+=width-line.width;
  const gaps=line.items.filter(r=>r.space).length,extra=block.align==='justify'&&!last&&gaps?(width-line.width)/gaps:0;
  for(const item of line.items){if(!item.space)page.drawText(item.value,{x,y:L.height-top-size,size,font:item.font});x+=item.width+(item.space?extra:0);}
 }
 function height(block,width){const ls=lines(block,width);return ls.length*(block.leading||L.leading)+(block.after||0);}
 async function ensure(h){if(h>L.height-L.top-L.bottom)throw Error('These details do not fit the PDF. Download Word to adjust it.');if(y+h>L.height-L.bottom)await newPage();}
 async function paragraph(block,x=L.left,width=L.width-L.left-L.right){
  const ls=lines(block,width),lead=block.leading||L.leading;
  if(!ls.length){y+=block.emptySpace||0;return;}
  // Keep paragraphs together: identifiers and notary clauses are never split.
  await ensure(ls.length*lead+(block.after||0));
  ls.forEach((line,i)=>drawLine(line,block,x,width,y+i*lead,i,i===ls.length-1));
  y+=ls.length*lead+(block.after||0);
 }
 for(let i=0;i<L.blocks.length;i++){
  const b=L.blocks[i];if(b.pageBreak&&y>L.top)await newPage();
  if(b.type==='space'){y+=b.height;continue;}
  if(b.type==='columns'){
   const colWidth=(L.width-L.left-L.right-b.gap)/2;
   const cells=b.cells.map(cell=>cell.filter(p=>materialize(p).some(r=>r.text.trim())));
   if(cells.every(c=>!c.length))continue;
   const heights=cells.map(cell=>cell.reduce((s,p)=>s+height(p,colWidth),0));
   const h=Math.max(...heights)+(b.signatureSpace||0)+(b.after||0);await ensure(h);
   const rowY=y+(b.signatureSpace||0);
   for(let col=0;col<cells.length;col++){let top=rowY;for(const p of cells[col]){const ls=lines(p,colWidth),lead=p.leading||L.leading;ls.forEach((line,j)=>drawLine(line,p,L.left+col*(colWidth+b.gap),colWidth,top+j*lead,j,j===ls.length-1));top+=ls.length*lead+(p.after||0);}}
   y+=h;continue;
  }
  const width=L.width-L.left-L.right-(b.indent||0);
  if(b.keepWithNext&&L.blocks[i+1]&&L.blocks[i+1].type==='paragraph')await ensure(height(b,width)+height(L.blocks[i+1],width));
  await paragraph(b,L.left+(b.indent||0),width);
 }
 pdf.setTitle(template.label||template.title||template.id);pdf.setAuthor('');pdf.setSubject('Prepared from the supplied template. Signatures and notarial particulars remain blank.');
 return pdf.save({useObjectStreams:false});
}
