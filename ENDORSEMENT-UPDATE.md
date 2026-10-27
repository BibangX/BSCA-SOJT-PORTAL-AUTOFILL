# Endorsement format update

Apply these files to the existing public GitHub Pages autofill version, preserving their folders. This is an update package, not a complete new website and not for the protected Netlify backend edition.

The supplied Word letter now fills inline, retaining letterhead, official body text, objectives and unsigned signatory blocks. Coordinator and chairperson designations use dropdowns. The training office/department is optional and defaults to the company name. Starting date and recipient name are reused wherever repeated in the letter.

The wording still specifies 700 hours, second semester and 18 weeks as in the provided template. Change the source template and its PDF layout together if those terms change.

Word line spacing was corrected to match the PDF reference and prevent an orphan line on a second page. Normal/long Unicode samples were rendered and visually checked in Word and PDF; maximum-length PDF values can flow to a clean second page. No boxed placeholder form is used for endorsement. Signatures and approval remain manual.

QA: 17 automated checks pass, including unchanged Intent/Company generation, repeated placeholders, designation validation, optional department fallback, Unicode and long-value pagination. Portal Word/PDF download buttons tested in the browser.

This update does not implement the discussed Level 1/2 company-status workflow.
