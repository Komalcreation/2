# Komal Creations & Training Center — Website

**Stack:** Plain HTML · CSS · Vanilla JS (ES Modules) · Supabase  
**Hosting:** GitHub Pages (zero build step)

---

## File Structure

```
/
├── index.html              ← Single-page main site (all sections)
├── admin-login.html        ← Staff authentication
├── admin.html              ← (you build) Staff dashboard
├── css/
│   └── styles.css          ← All styles, mobile-first
├── js/
│   └── app.js              ← All logic, Supabase integration
└── assets/
    └── (logo, favicon, OG image etc.)
```

---

## 1. Add Your Supabase Keys

Open **`js/app.js`** and **`admin-login.html`** and replace:

```js
const SUPABASE_URL      = "https://YOUR_PROJECT_ID.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY_HERE";
```

⚠️ **NEVER** use your `service_role` key in any frontend file.  
The anon key is safe here because your Supabase RLS policies control access.

---

## 2. Deploy to GitHub Pages

1. Push all files to your `main` or `gh-pages` branch.
2. In GitHub → Settings → Pages → Source: `main` branch, root `/`.
3. Your site lives at `https://komalcreation.github.io/web/`.

---

## 3. Test Inquiry Form

1. Open `index.html#contact`
2. Fill in Name, Phone, Age, Course, optional Message
3. Click **ਫਾਰਮ ਭੇਜੋ**
4. Check Supabase → Table Editor → `public.inquiries`

---

## 4. Test Certificate Verification

1. In Supabase → `public.certificates`, insert a test row:
   - `verification_code` = `KC9AA10`
   - `is_active` = `true`
   - Fill other required fields
2. Open `index.html#verify`
3. Type `KC9AA10` → click Verify
4. Result card appears with student details

---

## 5. Add Gallery Images

In Supabase → `public.gallery`, insert rows with:
- `image_url` — public URL (Supabase Storage, Cloudinary, Unsplash, etc.)
- `is_published` = `true`
- `sort_order` — controls display order

---

## 6. Dynamic Site Content

In Supabase → `public.site_content`, add rows like:

| content_key        | content_pa           | content_en           | content_type | is_published |
|--------------------|----------------------|----------------------|--------------|--------------|
| hero_badge         | ਨੰਬਰ 1 ਸਿਲਾਈ ਸੈਂਟਰ | Top Stitching Center | text         | true         |
| hero_description   | …Punjabi text…       | …English text…       | text         | true         |
| about_text         | …Punjabi text…       | …English text…       | text         | true         |

Elements with `data-content-key="hero_badge"` in HTML are automatically populated.

For **courses**, use `content_type = 'course'` — these replace the static course cards.

---

## 7. Security Notes

- RLS is enforced on all tables — anon users can only INSERT inquiries and SELECT active certs/gallery/published content.
- Honeypot field in inquiry form catches basic bots.
- All user input is HTML-escaped before rendering.
- Never expose `service_role` key — only use it in Supabase Dashboard or secure server functions.

---

## Language Support

The site defaults to **Punjabi (Gurmukhi)**. Clicking 🌐 switches to **English**. Preference is saved in localStorage. Elements use `.pa` / `.en` CSS classes toggled by `app.js`.
