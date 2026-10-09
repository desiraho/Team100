# Team 100 website

Independent project at D:\Team100. No files from the Desi Raho website are used or modified.

## Preview
Requires Node.js 20 or newer. No dependency installation needed.

    npm run dev

Open http://localhost:4173. Set PORT to change the port.

    npm run check
    npm run build

The build checks the required section order, anchors, IDs and referenced images, then copies the deployable static site into dist/. No deployment has been performed.

## Editing
- content.js: videos, approved external URLs, people, mentors, impact figures, contact details.
- index.html: section copy, programs, contribution options and disabled registration preview.
- styles.css: responsive green/gold design and reduced-motion support.
- app.js: navigation, carousel and accessible native dialogs.

Valid YouTube URLs play in an on-page modal without autoplay. Closing the modal removes the player and stops playback. The hero video is configured in content.js. Null URLs display a coming-soon dialog. Setting registrationUrl to an approved Google Form URL enables the external registration flow. Until then, a disabled form preview collects and submits nothing.

## Sources and pending content
The Google document is the structure/content authority:
https://docs.google.com/document/d/1cvPmEWVZQgQKNX7foMzgmYiOwMWGIbzXiNqmeOYkSLI/edit

Photos are extracted from D:\DesiRaho\Shiksha Ki  Ore.pdf. Filenames record PDF page and embedded image index. PDF statistics, team listings and instructions do not override the website brief. The founder portrait is identified in the PDF. Location photos are illustrative and visibly labelled pending because photo-specific locations are not established.

Pending: final logo/brand approval, founder/gallery YouTube URLs, Google Form URL, three selected team members and biographies, donor profiles, confirmed spelling of Rajesh's surname, phone, social links and location-specific photos. Rajesh's surname is deliberately omitted until confirmed. A typographic Team 100 mark is used as a provisional identity.

The source's annual and half-yearly contribution figures are preserved as provided; no payment processing exists. Google Fonts enhance typography when available; local Arial/Georgia fallbacks work offline.

## QA
qa.mjs uses the Playwright installation bundled with this Codex environment. It checks desktop/tablet/mobile overflow, photos, section navigation, gallery controls, dialogs, focus restoration and the disabled registration preview. Screenshots are in qa/. These QA files are not included in dist/.


## Website registration
The native form now posts to /api/register through the Cloudflare Pages worker. Follow integration/SETUP.md to deploy its Google Apps Script receiver and configure Cloudflare secrets and Turnstile. The form cannot save responses until this setup is complete. The destination sheet can be changed via the Apps Script SPREADSHEET_ID property. Only dist is public; never upload integration. The active theme is Meadow and Lemon.
