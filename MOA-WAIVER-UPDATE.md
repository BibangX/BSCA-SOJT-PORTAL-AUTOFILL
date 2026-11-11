# Public portal form and template update

Upload every file in this ZIP to the matching location in your existing public GitHub Pages repository. Start at the folder containing index.html. Preserve the templates, vendor, and development folders. This is an update, not a standalone website. It requires the public Level 1–2 workflow edition and must not replace the protected Netlify edition.

New required files: person-fields.js, form-state.js, pronoun-values.js. Upload these together with autofill.js, autofill.css, autofill-engine.js and the included templates. Then refresh the deployed page (Ctrl+Shift+R).

## Student experience

1. Enter student information in Level 1 and company information in Level 2.
2. Choose optional pronouns once for each person, including the adviser. MOA requires dean and representative pronouns because its acknowledgment uses them.
3. Open the document level, fill remaining details, review, and download Word or PDF.
4. Complete signatures, upload to Google Drive, then submit the direct file link through the existing Google Form.

Changing a person's name clears that person's previous pronouns. Blank optional choices use neutral wording. Automatically filled waiver durations follow training date changes. Custom durations remain intact and request review when dates change. The Use my training dates button restores automatic dates.

Manual endorsement, MOA, and waiver downloads now have blank spaces rather than code placeholders. Autofill masters remain separate. The waiver remains optional and does not replace parent/guardian consent or medical clearance.

Saved details remain browser-local and optional. Downloading or confirming information does not submit a document or grant coordinator approval. Existing map artwork, Google Form URLs, company references and progress rules are unchanged by this patch.

## QA

40 automated checks passed, including actual Word/PDF generation, centered MOA columns, pronoun forms, validation, optional students, shared-field resets, and automatic/custom durations. All seven rendered pages of the three manual templates inspected. Desktop browser checks verified shared values, name/pronoun reset, date refresh across levels, aligned rows and add/remove behavior. Physical phone/tablet testing remains unverified.

## Development

The development files are optional for GitHub Pages serving. To run tests, enter development, run npm ci, then npm test. Run npm run build after changing engine-source.mjs or pronoun-values.js. New templates can use person_pronouns_subject, person_pronouns_object, person_pronouns_possessive, person_pronouns_possessive_pronoun and person_pronouns_reflexive; retain the person's base pronoun key in template.fields. Existing *_pronouns placeholders continue to mean his/her/their.
