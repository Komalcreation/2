# Komal Creations & Training Center - Web & Backend Ledger

This repository contains the complete frontend code (HTML5, CSS3, JavaScript) and backend Supabase SQL setup script for **Komal Creations & Training Center**. 

The architecture is completely serverless and static, meaning it can be hosted for **free** on GitHub Pages while safely interacting with your Supabase database using **Row Level Security (RLS)** policies.

---

## Folder Structure

*   [index.html](file:///e:/Workplace/KCTC/index.html) - Core homepage markup (Includes hero, boutique creations, academy courses, stitching price estimator, certificate ledger verification container, spam honeypot input, and responsive structure).
*   [style.css](file:///e:/Workplace/KCTC/style.css) - Premium styling system featuring luxury design tokens, smooth hover animations, dark/light mode CSS variables, and layout styles.
*   [app.js](file:///e:/Workplace/KCTC/app.js) - Client-side ES module logic (Initializes Supabase connection using ESM CDN, handles anti-spam validations, queries certificate ledgers, calculates custom stitching totals, and manages active theme states).
*   [config.js](file:///e:/Workplace/KCTC/config.js) - Project configuration file for storing your Supabase project API keys.
*   [supabase_setup.sql](file:///e:/Workplace/KCTC/supabase_setup.sql) - Database initialization script including schema layouts, indices, security rules, and sample credentials.

---

## 🚀 4-Step Supabase Setup Checklist

Follow these steps to connect your static GitHub Pages website to your Supabase database backend:

### Step 1: Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in/sign up.
2. Click **New Project** in your dashboard organization.
3. Enter the project details:
    *   **Name:** `Komal Creations`
    *   **Database Password:** *Choose a secure password (write it down!)*
    *   **Region:** Select the region closest to your target audience.
4. Click **Create new project** and wait a few minutes for the database nodes to provision.

### Step 2: Initialize Database Schema (SQL Editor)
1. In your Supabase project dashboard, click on the **SQL Editor** tab from the left sidebar navigation (represented by the `SQL` icon).
2. Click **New Query** -> **Blank Query**.
3. Open the [supabase_setup.sql](file:///e:/Workplace/KCTC/supabase_setup.sql) file from this workspace, copy the entire SQL script, and paste it into the editor window.
4. Click **Run** (or press `Ctrl + Enter` / `Cmd + Enter`). You should see a success message indicating queries executed successfully, which creates the tables, indexes, security policies, and imports mock testing entries.

### Step 3: Create an Admin User (Authentication)
1. Go to the **Authentication** tab from the left sidebar navigation (represented by the user/key icon).
2. Click **Users** -> **Add User** -> **Create User**.
3. Enter the email address and password for the admin account (who will manage student certificates and review inquiries).
4. Click **Create User**. 
    *   *Note: In production, you can invite users or manually confirm emails. By default, this account satisfies the `auth.role() = 'authenticated'` condition, giving this email full admin read/write permissions via standard API/Dashboard tools.*

### Step 4: Add Keys to Frontend Javascript
1. Go to the **Project Settings** tab (gear icon at the bottom of the left sidebar).
2. Click on **API** in the settings menu.
3. Locate your project credentials:
    *   **Project URL:** Found under *Project API keys* (looks like `https://xyz.supabase.co`).
    *   **Anon Key:** Found under *Project API keys* marked as `anon` `public` (this is the public browser API token).
4. Open your local [config.js](file:///e:/Workplace/KCTC/config.js) file.
5. Replace `'YOUR_SUPABASE_URL'` and `'YOUR_SUPABASE_ANON_KEY'` with the values you copied:
    ```javascript
    const SUPABASE_CONFIG = {
        URL: 'https://your-project-id.supabase.co', 
        ANON_KEY: 'your-long-anon-jwt-token'
    };
    ```
6. Save the file and reload your homepage!

---

## 🔒 Row Level Security (RLS) Summary

To ensure database integrity and protect against malicious client scripts:
1.  **`inquiries` Table:** RLS is enabled. Anonymous users (`public`) are only granted `INSERT` access. They cannot query existing inquiries, update status values, or delete leads. Only your logged-in administrator (`authenticated` role) has read/write credentials.
2.  **`certificates` Table:** RLS is enabled. Anyone (`public`) can run a search (`SELECT`) to authenticate matching verification codes. However, `INSERT`, `UPDATE`, and `DELETE` commands are restricted exclusively to `authenticated` administrative sessions.

---

## 🛡️ Honeypot Spam Protection

Automated spambots parse websites and programmatically submit every input field.
*   We've added a dummy text field with `id="website_address"` and wrapped it in a `.honey-field` CSS class that hides it completely from regular visitors.
*   In [app.js](file:///e:/Workplace/KCTC/app.js), during form submission, the script checks if `website_address` contains any value. If it is filled, it indicates a spambot filled it out automatically, and the code immediately ignores the request without saving it to the database, saving database resources and avoiding spam inquiries!
