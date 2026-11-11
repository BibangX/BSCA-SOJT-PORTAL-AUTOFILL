const forms={
 'he/him':{subject:'he',object:'him',possessive:'his',possessive_pronoun:'his',reflexive:'himself'},
 'she/her':{subject:'she',object:'her',possessive:'her',possessive_pronoun:'hers',reflexive:'herself'},
 'they/them':{subject:'they',object:'them',possessive:'their',possessive_pronoun:'theirs',reflexive:'themselves'}
};
export function expandPronouns(clean,manifest){
 const result={};
 for(const [key,value] of Object.entries(clean)){
  if(key.endsWith('_pronouns')){
   const selected=forms[value]||forms['they/them'];result[key]=selected.possessive;
   for(const [kind,word] of Object.entries(selected))result[key+'_'+kind]=word;
  }else result[key]=manifest.fields[key]?.type==='date'&&value?new Intl.DateTimeFormat('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(new Date(value+'T00:00:00Z')):value;
 }
 return result;
}
