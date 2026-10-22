# BSCA SOJT — public GitHub Pages test version

This standalone static copy needs no server, installation, Google OAuth setup, or login. It preserves the latest pirate map, soft illustrated assets, cat captain, matching theme, stars, all 15 Word templates, and existing Google Forms links.

## Upload
Extract the ZIP and upload its contents to your GitHub Pages publishing folder. index.html must be at the publishing root; keep assets and templates folders intact. Replace matching static files. Keep your existing Pages settings.

## Demo progress only
Opening a map step automatically gives one demo star. Inside each step, Test the star display lets you preview two and three stars. These selections are clearly labeled simulations: no submission or coordinator approval is created. Progress is stored in that browser only, not per student; no database or account exists. Reset demo progress clears it. Real Google Forms submissions still happen in Google Forms and do not automatically change these demo stars.

## Scope
This public version is separate from the protected Node.js edition. It contains no server, accounts, allowlist, sessions, coordinator review tools or saved student records. All bundled materials are publicly accessible when deployed. Google Forms and Drive retain their independent permissions. Do not replace a running protected server with this static package.

No npm commands are required. All site asset paths are relative for deployment beneath a GitHub repository path.

## Browser autofill first release
Open Intent, Company Information or Endorsement and choose Prepare document. Common details are reused in the same tab. Optional Remember my details saves them only in that browser; use Clear all details on shared devices. Review and confirm details, then download Word or PDF. Upload the signed document to Drive and submit its direct file link using the existing form. Generation does not submit anything or approve progress.

All generation runs locally in the browser with bundled libraries and fonts, without a paid conversion service. First use needs internet to load the scripts and template files. Downloads are not synchronized across devices. Word and PDF have matching data and wording, but their layouts are separately prepared. Signatures and approvals remain blank.

The three new masters are coordinator-review drafts; endorsement wording/layout has been normalized from the older sample. Check wording, signatory titles and institutional requirements before releasing for official use. No sample dates, required hours or student/company identities are assumed. Existing blank templates and the other six levels remain available.

PDF values are validated to fit the allocated space. If unusually long text cannot fit legibly, the portal explains the issue and offers Word as the editable alternative. Do not replace a PDF master without updating its field mapping.

## QA completed
14 automated checks cover required fields, lengths, dates/leap dates, academic years, Unicode names, zero units, Drive links, escaping, filenames, all six real document outputs and flattened PDFs. All three generated Word documents and PDFs were rendered and inspected. Browser checks covered review confirmation, Word/PDF generation, shared details across levels, phone-sized form layout, and loading under a GitHub-style project subpath. Actual iPhone/Android download behavior still needs testing on the user's devices.

## Development only
The deployment is ready to upload; no build is required. To modify the generation engine, use the optional development folder: npm ci, npm test, then npm run build there. Masters are in templates/autofill; manifest.json defines their fields. The source engine is bundled into autofill-engine.js. Keep vendor font and license files.
