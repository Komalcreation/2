/**
 * Komal Creations & Training Center — js/app.js
 * Vanilla JS, ES Modules, Supabase CDN
 * GitHub Pages compatible — no build step required
 *
 * ⚠️  Replace SUPABASE_URL and SUPABASE_ANON_KEY below with your real values.
 *     NEVER place your service_role key here — anon key only.
 */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/* ── CONFIG ──────────────────────────────────────────────── */
const SUPABASE_URL      = "https://YOUR_PROJECT_ID.supabase.co";   // ← replace
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY_HERE";                    // ← replace

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ── STATE ───────────────────────────────────────────────── */
let currentLang = "pa"; // 'pa' = Punjabi (default) | 'en' = English

/* ── DOM HELPERS ─────────────────────────────────────────── */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/** Safely get a DOM element; throw if missing and warn developer. */
function getEl(id) {
  const el = document.getElementById(id);
  if (!el) console.warn(`[KC] Element #${id} not found.`);
  return el;
}

/** XSS-safe HTML escape */
function escapeHtml(str) {
  if (typeof str !== "string") return str ?? "";
  return str
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&#39;");
}

/** Show a status message in a target element */
function showMsg(el, text, type = "error") {
  if (!el) return;
  el.textContent = text;
  el.className = `form-msg ${type}`;
  el.hidden = false;
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function hideMsg(el) {
  if (!el) return;
  el.hidden = true;
  el.textContent = "";
  el.className = "form-msg";
}

/** Simple loading toggle on a <button> */
function setLoading(btn, loading) {
  if (!btn) return;
  const textSpans    = $$(".btn-text", btn);
  const loadingSpan  = $(".btn-loading", btn);
  btn.disabled = loading;
  textSpans.forEach(s => { s.hidden = loading; });
  if (loadingSpan) loadingSpan.hidden = !loading;
}

/* ── LANGUAGE SWITCHER ───────────────────────────────────── */
function initLangToggle() {
  const btn   = getEl("langToggle");
  const label = getEl("langLabel");
  if (!btn) return;

  btn.addEventListener("click", () => {
    currentLang = currentLang === "pa" ? "en" : "pa";
    const isEn = currentLang === "en";

    // Toggle .hidden on all .pa / .en elements
    $$(".pa").forEach(el => el.classList.toggle("hidden", isEn));
    $$(".en").forEach(el => el.classList.toggle("hidden", !isEn));

    if (label) label.textContent = isEn ? "ਪੰਜਾਬੀ" : "English";

    // Update html lang
    document.documentElement.lang = isEn ? "en" : "pa";

    // Persist preference
    try { localStorage.setItem("kc_lang", currentLang); } catch (_) {}
  });

  // Restore saved preference
  try {
    const saved = localStorage.getItem("kc_lang");
    if (saved && saved !== "pa") btn.click();
  } catch (_) {}
}

/* ── MOBILE NAV ──────────────────────────────────────────── */
function initMobileNav() {
  const toggle = getEl("navToggle");
  const nav    = getEl("mainNav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    nav.classList.toggle("is-open", !expanded);
  });

  // Close on nav link click (mobile)
  $$(".nav-link", nav).forEach(link => {
    link.addEventListener("click", () => {
      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
    });
  });

  // Close on outside click
  document.addEventListener("click", e => {
    if (!nav.contains(e.target) && !toggle.contains(e.target)) {
      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
    }
  });
}

/* ── ACTIVE NAV LINK (scroll spy) ────────────────────────── */
function initScrollSpy() {
  const sections = $$("section[id]");
  const navLinks = $$(".nav-link");

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(a => {
          a.classList.toggle("active", a.getAttribute("href") === `#${id}`);
        });
      }
    });
  }, { threshold: 0.35 });

  sections.forEach(s => obs.observe(s));
}

/* ── SITE CONTENT (from Supabase) ────────────────────────── */
async function loadSiteContent() {
  try {
    const { data, error } = await supabase
      .from("site_content")
      .select("content_key, title, content_en, content_pa")
      .eq("is_published", true)
      .order("sort_order");

    if (error) throw error;
    if (!data || data.length === 0) return;

    data.forEach(row => {
      const els = $$(`[data-content-key="${escapeHtml(row.content_key)}"]`);
      els.forEach(el => {
        const text = currentLang === "en" ? (row.content_en || row.content_pa) : (row.content_pa || row.content_en);
        if (text) el.textContent = text;
      });
    });
  } catch (err) {
    // Silently fail — static fallback text already in HTML
    console.warn("[KC] site_content load failed:", err.message);
  }
}

/* ── GALLERY (from Supabase) ──────────────────────────────── */
async function loadGallery() {
  const grid   = getEl("galleryGrid");
  const msgEl  = getEl("galleryMsg");
  if (!grid) return;

  try {
    const { data, error } = await supabase
      .from("gallery")
      .select("id, image_url, alt_text, caption_en, caption_pa, category")
      .eq("is_published", true)
      .order("sort_order");

    if (error) throw error;

    // Clear shimmer placeholders
    grid.innerHTML = "";

    if (!data || data.length === 0) {
      grid.innerHTML = `<div class="gallery-empty">
        <p>${currentLang === "en" ? "Gallery photos coming soon." : "ਗੈਲਰੀ ਤਸਵੀਰਾਂ ਜਲਦੀ ਆਉਣਗੀਆਂ।"}</p>
      </div>`;
      return;
    }

    const frag = document.createDocumentFragment();
    data.forEach(item => {
      const caption = currentLang === "en"
        ? (escapeHtml(item.caption_en) || escapeHtml(item.alt_text) || "")
        : (escapeHtml(item.caption_pa) || escapeHtml(item.alt_text) || "");

      const div = document.createElement("div");
      div.className = "gallery-item";
      div.innerHTML = `
        <img src="${escapeHtml(item.image_url)}"
             alt="${escapeHtml(item.alt_text) || "Komal Creations work"}"
             loading="lazy" width="400" height="300" />
        ${caption ? `<div class="gallery-caption">${caption}</div>` : ""}
      `;
      frag.appendChild(div);
    });
    grid.appendChild(frag);
  } catch (err) {
    console.warn("[KC] Gallery load failed:", err.message);
    if (grid) {
      grid.innerHTML = `<div class="gallery-empty">
        <p>${currentLang === "en" ? "Could not load gallery." : "ਗੈਲਰੀ ਲੋਡ ਨਹੀਂ ਹੋਈ। ਕਿਰਪਾ ਬਾਅਦ ਵਿੱਚ ਕੋਸ਼ਿਸ਼ ਕਰੋ।"}</p>
      </div>`;
    }
  }
}

/* ── COURSES (from site_content or static fallback) ─────── */
async function loadCourses() {
  /**
   * Courses are stored in site_content with content_type = 'course'
   * Falls back to static HTML cards already rendered.
   */
  try {
    const { data, error } = await supabase
      .from("site_content")
      .select("content_key, title, content_en, content_pa, sort_order")
      .eq("is_published", true)
      .eq("content_type", "course")
      .order("sort_order");

    if (error) throw error;
    if (!data || data.length === 0) return; // keep static fallback

    const grid = getEl("coursesGrid");
    if (!grid) return;

    // Only replace if we have dynamic data
    grid.innerHTML = "";
    const icons = ["✂️","🌸","👗","🪡","💎","🧶"];
    data.forEach((row, i) => {
      const title   = currentLang === "en" ? (row.title || "") : (row.title || "");
      const desc    = currentLang === "en" ? (row.content_en || row.content_pa) : (row.content_pa || row.content_en);
      const enroll  = currentLang === "en" ? "Enroll →" : "ਦਾਖਲਾ ਲਓ →";

      const card = document.createElement("div");
      card.className = "course-card";
      card.innerHTML = `
        <div class="course-icon" aria-hidden="true">${icons[i % icons.length]}</div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(desc || "")}</p>
        <a href="#contact" class="btn-course-enroll">${enroll}</a>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    console.warn("[KC] Courses load failed:", err.message);
    // Static fallback already rendered — nothing to do
  }
}

/* ── INPUT VALIDATION ────────────────────────────────────── */
function validatePhone(phone) {
  return /^[+]?[\d\s\-().]{8,15}$/.test(phone.trim());
}

function validateInquiryForm() {
  const fullName        = getEl("fullName");
  const phoneNumber     = getEl("phoneNumber");
  const age             = getEl("age");
  const courseInterested = getEl("courseInterested");
  const msgEl           = getEl("inquiryMsg");

  let valid = true;
  [fullName, phoneNumber, age, courseInterested].forEach(f => f && f.classList.remove("error"));

  if (!fullName?.value.trim() || fullName.value.trim().length < 2) {
    fullName?.classList.add("error");
    showMsg(msgEl, currentLang === "en" ? "Please enter your full name." : "ਕਿਰਪਾ ਆਪਣਾ ਪੂਰਾ ਨਾਮ ਦਰਜ ਕਰੋ।", "error");
    valid = false;
  } else if (!validatePhone(phoneNumber?.value)) {
    phoneNumber?.classList.add("error");
    showMsg(msgEl, currentLang === "en" ? "Please enter a valid phone number." : "ਕਿਰਪਾ ਸਹੀ ਫ਼ੋਨ ਨੰਬਰ ਦਰਜ ਕਰੋ।", "error");
    valid = false;
  } else if (!age?.value || isNaN(Number(age.value)) || Number(age.value) < 10 || Number(age.value) > 60) {
    age?.classList.add("error");
    showMsg(msgEl, currentLang === "en" ? "Please enter a valid age (10–60)." : "ਕਿਰਪਾ ਸਹੀ ਉਮਰ ਦਰਜ ਕਰੋ (10–60)।", "error");
    valid = false;
  } else if (!courseInterested?.value) {
    courseInterested?.classList.add("error");
    showMsg(msgEl, currentLang === "en" ? "Please select a course." : "ਕਿਰਪਾ ਕੋਰਸ ਚੁਣੋ।", "error");
    valid = false;
  }
  return valid;
}

/* ── INQUIRY SUBMIT ──────────────────────────────────────── */
async function handleInquirySubmit() {
  const btn     = getEl("submitInquiry");
  const msgEl   = getEl("inquiryMsg");
  const honeypot = document.getElementById("hp_website");

  hideMsg(msgEl);

  // Honeypot check — bots fill hidden fields
  if (honeypot && honeypot.value.trim() !== "") {
    showMsg(msgEl, "Spam detected.", "error");
    return;
  }

  if (!validateInquiryForm()) return;

  setLoading(btn, true);

  const payload = {
    full_name:         getEl("fullName")?.value.trim(),
    phone_number:      getEl("phoneNumber")?.value.trim(),
    age:               parseInt(getEl("age")?.value, 10),
    course_interested: getEl("courseInterested")?.value,
    message:           getEl("message")?.value.trim() || null,
    source:            "website",
    status:            "new",
  };

  try {
    const { error } = await supabase
      .from("inquiries")
      .insert([payload]);

    if (error) throw error;

    showMsg(
      msgEl,
      currentLang === "en"
        ? "✅ Thank you! Your enquiry has been submitted. We will contact you on WhatsApp shortly."
        : "✅ ਤੁਹਾਡਾ ਫਾਰਮ ਸਫਲਤਾਪੂਰਵਕ ਭੇਜਿਆ ਗਿਆ ਹੈ। ਅਸੀਂ ਜਲਦੀ ਹੀ WhatsApp 'ਤੇ ਸੰਪਰਕ ਕਰਾਂਗੇ।",
      "success"
    );

    // Reset form fields
    ["fullName","phoneNumber","age","courseInterested","message"].forEach(id => {
      const el = getEl(id);
      if (el) el.value = "";
    });
  } catch (err) {
    console.error("[KC] Inquiry submit error:", err.message);
    showMsg(
      msgEl,
      currentLang === "en"
        ? "❌ Could not submit. Please try again or call us directly."
        : "❌ ਫਾਰਮ ਭੇਜਿਆ ਨਹੀਂ ਗਿਆ। ਕਿਰਪਾ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ ਜਾਂ ਸਾਨੂੰ ਕਾਲ ਕਰੋ।",
      "error"
    );
  } finally {
    setLoading(btn, false);
  }
}

/* ── CERTIFICATE VERIFICATION ────────────────────────────── */
async function handleCertificateVerify() {
  const btn      = getEl("verifyBtn");
  const input    = getEl("verifCode");
  const msgEl    = getEl("verifyMsg");
  const resultEl = getEl("certResult");

  hideMsg(msgEl);
  if (resultEl) { resultEl.hidden = true; resultEl.innerHTML = ""; }

  const code = input?.value.trim().toUpperCase();

  if (!code || code.length < 3) {
    showMsg(msgEl, currentLang === "en"
      ? "Please enter a verification code."
      : "ਕਿਰਪਾ ਵੈਰੀਫਿਕੇਸ਼ਨ ਕੋਡ ਦਰਜ ਕਰੋ।",
      "error");
    return;
  }

  setLoading(btn, true);

  try {
    const { data, error } = await supabase
      .from("certificates")
      .select("student_name, father_name, roll_number, course_name, passing_year, grade, verification_code, certificate_image_url, remarks, is_active")
      .eq("verification_code", code)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      showMsg(msgEl, currentLang === "en"
        ? `❌ No certificate found for code "${escapeHtml(code)}". Please check and try again.`
        : `❌ ਕੋਡ "${escapeHtml(code)}" ਲਈ ਕੋਈ ਸਰਟੀਫਿਕੇਟ ਨਹੀਂ ਮਿਲਿਆ। ਕਿਰਪਾ ਦੁਬਾਰਾ ਜਾਂਚ ਕਰੋ।`,
        "error");
      return;
    }

    // Build result card
    const labels = currentLang === "en"
      ? { name: "Student Name", father: "Father's Name", roll: "Roll Number", course: "Course", year: "Passing Year", grade: "Grade", code: "Verification Code", remarks: "Remarks" }
      : { name: "ਵਿਦਿਆਰਥੀ ਦਾ ਨਾਮ", father: "ਪਿਤਾ ਦਾ ਨਾਮ", roll: "ਰੋਲ ਨੰਬਰ", course: "ਕੋਰਸ", year: "ਪਾਸ ਸਾਲ", grade: "ਗ੍ਰੇਡ", code: "ਵੈਰੀਫਿਕੇਸ਼ਨ ਕੋਡ", remarks: "ਟਿੱਪਣੀ" };

    const validText = currentLang === "en" ? "✓ VERIFIED" : "✓ ਵੈਰੀਫਾਈਡ";

    let imageHtml = "";
    if (data.certificate_image_url) {
      imageHtml = `<div class="cert-image-wrap">
        <img src="${escapeHtml(data.certificate_image_url)}" alt="Certificate of ${escapeHtml(data.student_name)}" loading="lazy" />
      </div>`;
    }

    let remarksRow = "";
    if (data.remarks) {
      remarksRow = `<tr><th>${labels.remarks}</th><td>${escapeHtml(data.remarks)}</td></tr>`;
    }

    resultEl.innerHTML = `
      <div class="cert-result-header">
        <div class="cert-result-icon">🏅</div>
        <div>
          <div class="cert-result-title">${escapeHtml(data.student_name)}</div>
          <span class="cert-valid-badge">${validText}</span>
        </div>
      </div>
      <table class="cert-table" aria-label="Certificate details">
        <tbody>
          <tr><th>${labels.name}</th><td>${escapeHtml(data.student_name)}</td></tr>
          <tr><th>${labels.father}</th><td>${escapeHtml(data.father_name)}</td></tr>
          <tr><th>${labels.roll}</th><td>${escapeHtml(data.roll_number)}</td></tr>
          <tr><th>${labels.course}</th><td>${escapeHtml(data.course_name)}</td></tr>
          <tr><th>${labels.year}</th><td>${escapeHtml(String(data.passing_year))}</td></tr>
          <tr><th>${labels.grade}</th><td><strong>${escapeHtml(data.grade)}</strong></td></tr>
          <tr><th>${labels.code}</th><td><code>${escapeHtml(data.verification_code)}</code></td></tr>
          ${remarksRow}
        </tbody>
      </table>
      ${imageHtml}
    `;
    resultEl.hidden = false;
    resultEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (err) {
    console.error("[KC] Certificate verify error:", err.message);
    showMsg(msgEl, currentLang === "en"
      ? "❌ Verification failed. Please try again later."
      : "❌ ਵੈਰੀਫਿਕੇਸ਼ਨ ਅਸਫਲ। ਕਿਰਪਾ ਬਾਅਦ ਵਿੱਚ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
      "error");
  } finally {
    setLoading(btn, false);
  }
}

/* ── VERIFY INPUT — Enter key support ───────────────────── */
function initVerifyInput() {
  const input = getEl("verifCode");
  const btn   = getEl("verifyBtn");
  if (!input || !btn) return;
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") handleCertificateVerify();
  });
  btn.addEventListener("click", handleCertificateVerify);
}

/* ── INQUIRY BUTTON ─────────────────────────────────────── */
function initInquiryForm() {
  const btn = getEl("submitInquiry");
  if (!btn) return;
  btn.addEventListener("click", handleInquirySubmit);
}

/* ── INIT ────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initLangToggle();
  initScrollSpy();
  initInquiryForm();
  initVerifyInput();

  // Load dynamic data in parallel
  Promise.allSettled([
    loadSiteContent(),
    loadGallery(),
    loadCourses(),
  ]);
});
