# Atlanta Muslim Jamaat website

The community website for the Atlanta Muslim Jamaat, 5365 Flat Shoals Pkwy, Decatur, GA 30034.

It covers daily prayer times for Decatur, Jumu'ah, location and parking, Learn Islam guides, khutbah summaries, a resource library, events, programs, volunteering, Ramadan and Eid, giving with a zakat calculator, free and supporting memberships, a members-only forum, a photo gallery, and an admin dashboard.

## Current stage: preview

The site is a single page with sample content. Changes made in the admin dashboard are saved only in the visitor's own browser, and the "View as" menu at the top switches between visitor, member and staff views. These pieces connect later:

| Service | What it adds |
| --- | --- |
| Supabase | Real accounts (Google, Facebook, email sign-in), a shared database, photo storage |
| Resend | Email notifications from the admin outbox |
| Stripe | Card payments for donations and supporting-member dues |
| Custom domain | The public address, added in Vercel under Settings → Domains |

## Staff roles

| Role | For | Can use |
| --- | --- | --- |
| Super admin | Webmaster or IT lead | Everything, including roles, permissions and connections |
| Executive | President, vice president, secretary, treasurer | Analytics and PDF reports, donations ledger, approving logged gifts, members, messages, inbox |
| Office manager | Masjid office | Members, logging cash and checks, messages, inbox, events, prayer times, site settings, email |
| Imam | Imam or religious director | Khutbah summaries and other content, Ask the Imam inbox, prayer times, forum |
| Editor | Communications volunteer | Posts, articles, resources, events, gallery, email |
| Program coordinator | Education, youth or sisters' lead | Events, registrations, volunteers, gallery |
| Moderator | Trusted members | Forum and gallery |

Super admins can change any role's permissions in Admin → Members & team → Team & roles.

Gifts received outside the site (cash, checks, Zelle, the Jumu'ah box) are logged in the donations ledger and only count once a different person with approval rights approves them.

## How it's built

- `src/` holds the source: `head.html` (styles), `body.html` (page shell) and the JavaScript files.
- `build.sh` joins them into `public/index.html`. Vercel runs it on every deploy (see `vercel.json`).
- `public/` is what Vercel serves: the page, the web app manifest, the service worker, the icons (including the Apple touch icon) and `vendor/`, which holds jsPDF and jsPDF-AutoTable (MIT licensed) for PDF reports.

To build locally, run `sh build.sh` and open `public/index.html`.

## Editing

- Prayer calculation: `src/prayer.js` (ISNA method by default; admins can change it in the dashboard).
- Learn Islam guides: `src/learn.js` and `vLearnGuide` in `src/app2.js`. These are drafts awaiting the imam's review.
- Sample content: `src/data.js`.
- App icons: replace the files in `public/icons/` with the final logo, keeping the same names and sizes.
