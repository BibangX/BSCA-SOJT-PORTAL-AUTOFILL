// Canonical person fields are shared across every document, never inferred.
export const people=[
 {name:'adviser_name',pronouns:'adviser_pronouns',label:'Year-level adviser'},
 {name:'student_full_name',pronouns:'student_pronouns',label:'Student'},
 {name:'recipient_name',title:'recipient_title',pronouns:'recipient_pronouns',label:'Company representative'},
 {name:'dean_name',title:'dean_title',pronouns:'dean_pronouns',label:'College dean'},
 {name:'chairperson_name',title:'chairperson_title',pronouns:'chairperson_pronouns',label:'Department chairperson'},
 {name:'coordinator_name',title:'coordinator_title',pronouns:'coordinator_pronouns',label:'SOJT coordinator'},
 {name:'guardian_name',pronouns:'guardian_pronouns',label:'Parent or guardian'},
 {name:'additional_student_2',pronouns:'additional_student_2_pronouns',label:'Second student'},
 {name:'additional_student_3',pronouns:'additional_student_3_pronouns',label:'Third student'}
];
export function personDisplayKeys(keys){const result=[...keys];for(const person of people)if(keys.includes(person.name)&&!result.includes(person.pronouns))result.push(person.pronouns);return result;}
