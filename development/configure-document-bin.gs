// Run from Apps Script bound to the repeatable document submission form only.
function configureDocumentBin() {
  const form = FormApp.getActiveForm();
  if (!form || !form.getPublishedUrl().includes('1FAIpQLSe5qCpznRS8B3Y4E5b5DLS6zLipRlUU-ELr_tsh0gK_-HSU7A')) throw Error('Open this script from the document bin form. Verify its identity first.');
  const items=form.getItems().filter(i=>[FormApp.ItemType.LIST, FormApp.ItemType.MULTIPLE_CHOICE].includes(i.getType()) && /document.*type|type.*document/i.test(i.getTitle()));
  if(items.length!==1) throw Error('Identify one dropdown or multiple-choice question titled Document type.');
  const item=items[0], question=item.getType()===FormApp.ItemType.LIST?item.asListItem():item.asMultipleChoiceItem();
  const choices=question.getChoices().map(c=>c.getValue());
  const title='Document signature confirmation';
  const existing=form.getItems().filter(i=>i.getTitle()===title);
  if(existing.length>1 || existing.some(i=>i.getType()!==FormApp.ItemType.CHECKBOX))throw Error('Review the existing signature confirmation question.');
  const confirm=existing.length?existing[0].asCheckboxItem():form.addCheckboxItem();
  confirm.setTitle(title).setChoiceValues(['I confirm that this document is complete and has all required signatures.']).setRequired(true);
  form.setLimitOneResponsePerUser(false);
  const urls={};for(const choice of choices) urls[choice]=form.createResponse().withItemResponse(question.createResponse(choice)).toPrefilledUrl();
  console.log('window.SOJT_FORM_LINKS = '+JSON.stringify(urls,null,2)+';');
}
