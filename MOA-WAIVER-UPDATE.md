# MOA and waiver prefill update

Apply this patch to the public GitHub Pages portal after the Level 1-2 workflow update. Extract and upload all contents at the repository root, preserving folders, replacing matching files; commit changes. No installation or build is required for deployment. Do not apply to the protected Netlify/Supabase project.

Level 4: Prefill my MOA, review, then download Word or PDF. Student/company details and institutional signatories share the same saved fields as other documents. The agreement supports one primary and up to two additional students, with matching conditional signature spaces. Duplicate names are rejected. Internship plan stays a separate blank template until an updated master is supplied.

Level 5: optional liability waiver prefill, review, Word/PDF. Only use when the coordinator confirms it is required. The student and dean are reused. Duration starts from saved training dates when available, but students must check or correct it. Guardian and exact activity details are entered once for this document. Consent and medical requirements remain separate; this waiver does not replace either.

Designation dropdowns include Atty. Names are entered without repeating titles. Signatures, execution dates, official IDs and notarial entries remain blank. The MOA's substantive wording, 700 hours and Special Order reference remain as provided; only stale notarial years and author instructions were removed. The waiver letterhead is corrected to Department of Computer Applications in both Word and PDF downloads.

Browser-only saving is unchanged. Downloading is not submitting or approval. Upload signed completed files to Drive and submit the direct file link as instructed. This patch does not alter Google Forms or their document-type choices; the coordinator must confirm the forms provide the appropriate choice for a waiver if it is required.

QA: 30 automated checks passed; Word/PDF generation and normal/long fixture layouts inspected. MOA five pages and waiver one page for tested realistic inputs; longer entries can change pagination. Browser review/download routes and shared values checked. Physical mobile testing not performed.

## MOA centering and pronouns correction
Both party/signature columns are centered within their existing widths in Word and PDF. Required Dean pronouns and Company representative pronouns dropdowns offer he/him, she/her and they/them. Each choice generates his, her or their in the acknowledgment. Nothing is inferred from names or titles. The joint reference uses plural their/they. Saved information from older versions loads normally; choose the two new values before generating a new MOA. Already downloaded files do not change automatically.
