# Dental Care Clinic — Netlify-ready website

A responsive dental clinic landing page inspired by the broad layout of the supplied reference screenshot. Includes a booking modal, server-side validation, Supabase storage, and a staff appointment dashboard.

## Included
- Responsive landing page, services, team/clinic section, contact section and footer.
- Appointment modal with required-field checks, phone validation, consent checkbox and a simple visual CAPTCHA.
- Netlify Function that validates and saves requests to Supabase.
- Private staff page at `/admin.html` to review the latest 200 requests and update status.
- SQL schema with Row Level Security enabled and no public access policies.

## Before launch: customize the clinic details
The clinic phone number, opening hours, dentist names/qualifications and real patient reviews are deliberately not invented. Update those in `index.html` only after confirming them. The stock photos are remotely hosted Unsplash images; replace them with clinic-approved images if desired.

## 1. Create a Supabase database
1. Create a project at https://supabase.com/.
2. Open **SQL Editor** and run the full contents of `supabase-schema.sql`.
3. In Project Settings / API (or API Keys), copy the Project URL and the **service-role** key. Keep the service-role key private; it bypasses Row Level Security.
4. Use a strong unique admin key. Generate one locally with `openssl rand -hex 32` or a password manager.

## 2. Deploy to Netlify
1. Extract this ZIP.
2. Push the folder to a private GitHub repository, or use Netlify's manual deploy/drag-and-drop flow only if your workflow supports deploying Functions. For the most reliable deployment, connect the Git repository to Netlify.
3. In Netlify, create/import a site from that repository. Netlify reads `netlify.toml`.
4. In **Site configuration → Environment variables**, add:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_API_KEY`
5. Trigger a new deploy after adding environment variables.

## 3. Test the website
1. Open the deployed site and submit a test appointment using your own test details.
2. Check Supabase Table Editor → `appointments` for the new row.
3. Open `/admin.html`, enter the exact `ADMIN_API_KEY`, load requests, and change a request status to test the admin endpoint.
4. Confirm invalid phone numbers, missing consent, invalid treatment and incorrect CAPTCHA are rejected.

## 4. Local development
Install Node.js (LTS), then in the project directory:
```bash
npm install --global netlify-cli
netlify dev
```
Set the three environment variables in your shell or a local `.env` file (never commit `.env`). The Netlify CLI loads Functions and serves the site locally.

## Security and privacy notes
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` in frontend files.
- `ADMIN_API_KEY` is a shared bearer secret, not a full user-management system. Use a long random value, keep `/admin.html` private, rotate the key if it is exposed, and consider adding Supabase Auth or another proper staff identity system before handling real patient data.
- The basic CAPTCHA is client-side friction, not strong bot protection. For public production use, add Turnstile/reCAPTCHA server-side verification and rate limiting.
- Configure a privacy notice and retention policy appropriate to your clinic and local law. Collect only information needed for booking; do not request sensitive medical details through this form.
- This is a starter implementation, not a substitute for a security review. Test on a staging site before collecting real patient data.
- The site acknowledges requests but does not automatically confirm appointment availability. Staff must contact the patient to confirm.

## Structure
```text
dental-care-website/
├── index.html
├── admin.html
├── css/style.css
├── js/main.js
├── js/admin.js
├── netlify/functions/appointments.js
├── netlify/functions/admin-appointments.js
├── supabase-schema.sql
├── netlify.toml
├── .env.example
└── README.md
```
