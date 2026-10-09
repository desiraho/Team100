# Connect Team 100 registration to Google Sheets

The website code is ready, but submissions remain unavailable until these production settings and deployments are complete. Do not put secrets in content.js, index.html or the dist folder.

## 1. Deploy the Google receiver

1. Sign in as the account owning the response sheet (your boss). Open https://docs.google.com/spreadsheets/d/14H3rMah1ziW_HWPTrP3iDkT6dRU2Miy2ncwJd5YcX68/edit .
2. Choose Extensions > Apps Script. Replace Code.gs with the contents of integration/Code.gs from this project. Save.
3. Run setup once and authorize sheet access with that account. It preserves the nine questions and timestamp, and adds a hidden Submission ID column to prevent duplicate retries.
4. Open Project Settings > Script properties. Copy SHARED_SECRET directly to Cloudflare in step 2 below. Do not share it in chat. SPREADSHEET_ID identifies the destination sheet.
5. Deploy > New deployment > Web app. Execute as Me; access Anyone. Deploy and copy the URL ending /exec. This makes the receiver callable, but it accepts writes only with the shared secret. The spreadsheet stays private. If your institution disables anonymous web apps, use an NGO-owned Google account with access to the sheet instead.

## 2. Configure Cloudflare

1. Create a Managed Turnstile widget in Cloudflare. Allow team100india.org, www.team100india.org, and team100india.pages.dev.
2. Open Workers & Pages > team100india > Settings > Variables and Secrets. Set these for Production:
   - SHEETS_WEB_APP_URL: the Apps Script /exec URL.
   - SHEETS_SHARED_SECRET: a secret, exactly matching the Apps Script SHARED_SECRET.
   - TURNSTILE_SITE_KEY: the public widget site key.
   - TURNSTILE_SECRET_KEY: a secret, the widget secret key.
3. Upload the rebuilt dist folder as a Production deployment. Include _worker.js and _routes.json. Cloudflare supports _worker.js with dashboard direct upload; do not upload integration/.
4. On the live site, submit one clearly labelled test entry. Confirm exactly one row appears in Sheet1, then retry the same pending request if testing network failures. Success appears only after Google confirms the write. Delete your test row manually afterward.

## Change the destination sheet later

In Apps Script Project Settings, change SPREADSHEET_ID to the new sheet's ID. The script's executing account must have edit access. Run setup to verify/create the Sheet1 tab and matching column headers. No website rebuild or new script deployment is needed for this property-only change. Existing responses are not moved automatically. Use a new script deployment if changing Code.gs itself.

## Protection and limits

The server accepts same-origin JSON only, checks lengths and allowed values, verifies Turnstile on the server including hostname/action, and keeps the receiver secret server-side. Apps Script checks the secret and input again, serializes writes, stores user input as text, and uses the hidden submission ID to deduplicate retries. No request payloads or secrets are logged. Google and Cloudflare quotas still apply; Turnstile is spam mitigation, not a guarantee against all abuse. Keep sheet sharing restricted to the NGO's intended readers.

Official references:
https://developers.google.com/apps-script/guides/web
https://developers.cloudflare.com/pages/get-started/direct-upload/
https://developers.cloudflare.com/turnstile/get-started/server-side-validation/



## Owner deployment
Create a fresh bound script from the boss-owned sheet using Extensions > Apps Script. The boss must run setup and deploy while signed in to his account. Do not reuse the previous BITS-account deployment URL or shared secret. If reusing a script project, explicitly replace its SPREADSHEET_ID script property; setup preserves existing property values.
