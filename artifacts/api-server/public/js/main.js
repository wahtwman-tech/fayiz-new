/**
 * Main — shared utilities for all public pages
 */

// ── Language ──────────────────────────────────────────
const LANG_KEY = 'portfolio_lang';

function getLang() {
  return localStorage.getItem(LANG_KEY) || 'ar';
}

function setLang(lang) {
  localStorage.setItem(LANG_KEY, lang);
  applyLang(lang);
}

function applyLang(lang) {
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', lang);
  document.querySelectorAll('[data-ar]').forEach(el => {
    el.textContent = lang === 'ar' ? el.dataset.ar : (el.dataset.en || el.dataset.ar);
  });
  document.querySelectorAll('[data-ar-html]').forEach(el => {
    el.innerHTML = lang === 'ar' ? el.dataset.arHtml : (el.dataset.enHtml || el.dataset.arHtml);
  });
  document.querySelectorAll('[data-ar-placeholder]').forEach(el => {
    el.setAttribute('placeholder', lang === 'ar' ? el.dataset.arPlaceholder : (el.dataset.enPlaceholder || el.dataset.arPlaceholder));
  });
  document.querySelectorAll('.lang-toggle').forEach(btn => {
    btn.textContent = lang === 'ar' ? 'EN' : 'AR';
  });
}

function t(item, field) {
  const lang = getLang();
  if (!item) return '';
  return lang === 'ar'
    ? (item[field + 'Ar'] || item[field + 'En'] || '')
    : (item[field + 'En'] || item[field + 'Ar'] || '');
}

// ── Toast ─────────────────────────────────────────────
function toast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  el.prepend(Object.assign(document.createElement('span'), {
    className: 'toast-icon',
    textContent: icons[type] || icons.info
  }));
  container.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// ── Navbar + Drawer ───────────────────────────────────
async function initNavbar() {
  const lang = getLang();
  const settings = window._settings || {};

  // Logo - use image if available, otherwise text
  const logoText = document.getElementById('nav-logo-text');
  const drawerLogo = document.getElementById('drawer-logo');
  const footerLogoImg = document.getElementById('footer-logo-img');
  const footerLogoText = document.getElementById('footer-logo-text');
  const logoFallback = lang === 'ar' ? (settings.logo_text_ar || 'م.ح') : (settings.logo_text_en || 'MH');
  
  if (settings.logo_image) {
    if (logoText) {
      logoText.outerHTML = `<img src="${settings.logo_image}" alt="${logoFallback}" class="logo-img" id="nav-logo-text" />`;
    }
    if (drawerLogo) {
      drawerLogo.outerHTML = `<img src="${settings.logo_image}" alt="${logoFallback}" class="logo-img" id="drawer-logo" />`;
    }
    if (footerLogoImg) {
      footerLogoImg.src = settings.logo_image;
      footerLogoImg.style.display = 'block';
    }
    if (footerLogoText) {
      footerLogoText.style.display = 'none';
    }
  } else {
    if (logoText) logoText.textContent = logoFallback;
    if (drawerLogo) drawerLogo.textContent = logoFallback;
    if (footerLogoText) footerLogoText.textContent = logoFallback;
  }

  // Nav items
  let navItems = [];
  try { navItems = await api.getNav(); } catch {}

  const current = window.location.pathname;
  const buildLinks = (items, cls = '') =>
    items.filter(n => n.isActive).map(n => {
      const label = lang === 'ar' ? n.labelAr : (n.labelEn || n.labelAr);
      const isActive = (current === n.url || current.replace('.html','') === n.url.replace('.html','')) ? 'active' : '';
      return `<a href="${n.url}" class="${isActive} ${cls}" target="${n.target}">${label}</a>`;
    }).join('');

  const navLinksEl = document.getElementById('nav-links');
  if (navLinksEl) navLinksEl.innerHTML = buildLinks(navItems);

  const drawerNav = document.getElementById('mobile-drawer-nav');
  if (drawerNav) drawerNav.innerHTML = buildLinks(navItems);

  // Scroll effect
  const navbar = document.getElementById('navbar');
  if (navbar) window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 40), { passive: true });

  // Drawer open/close
  const hamburger = document.getElementById('hamburger');
  const drawer = document.getElementById('mobile-drawer');
  const overlay = document.getElementById('drawer-overlay');
  const drawerClose = document.getElementById('drawer-close');

  const openDrawer = () => {
    drawer?.classList.add('open');
    overlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  const closeDrawer = () => {
    drawer?.classList.remove('open');
    overlay?.classList.remove('open');
    document.body.style.overflow = '';
  };

  hamburger?.addEventListener('click', openDrawer);
  drawerClose?.addEventListener('click', closeDrawer);
  overlay?.addEventListener('click', closeDrawer);
  drawer?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));

  // Lang toggles (navbar + drawer)
  document.querySelectorAll('#lang-toggle, #drawer-lang-toggle').forEach(btn => {
    btn.textContent = lang === 'ar' ? 'EN' : 'AR';
    btn.addEventListener('click', () => {
      setLang(lang === 'ar' ? 'en' : 'ar');
      location.reload();
    });
  });
}

// ── Footer ────────────────────────────────────────────
async function initFooter() {
  const lang = getLang();
  const settings = window._settings || {};
  const year = new Date().getFullYear();

  const footerCopy = document.getElementById('footer-copy');
  if (footerCopy) {
    const name = lang === 'ar' ? (settings.hero_name_ar || '') : (settings.hero_name_en || '');
    const rights = lang === 'ar' ? (settings.footer_text_ar || 'جميع الحقوق محفوظة') : (settings.footer_text_en || 'All rights reserved');
    footerCopy.textContent = `© ${year} ${rights}`;
  }

  const socials = [
    { key: 'contact_whatsapp', icon: svgIcon('whatsapp') },
    { key: 'contact_telegram', icon: svgIcon('telegram') },
    { key: 'contact_facebook', icon: svgIcon('facebook') },
    { key: 'contact_email', icon: svgIcon('email') },
  ];

  document.querySelectorAll('#footer-social').forEach(el => {
    el.innerHTML = socials
      .filter(s => settings[s.key])
      .map(s => `<a href="${settings[s.key]}" target="_blank" rel="noopener">${s.icon}</a>`)
      .join('');
  });
}

// ── Scroll progress ───────────────────────────────────
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = max > 0 ? `${(window.scrollY / max) * 100}%` : '0%';
  }, { passive: true });
}

// ── Reveal on scroll ──────────────────────────────────
function initReveal() {
  const els = document.querySelectorAll('.reveal:not(.visible)');
  if (!els.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.08 });
  els.forEach(el => obs.observe(el));
}

// ── SVG Icons ─────────────────────────────────────────
function svgIcon(name) {
  const icons = {
    github:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>`,
    linkedin:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>`,
    twitter:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>`,
    whatsapp:  `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`,
    telegram:  `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>`,
    facebook:  `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
    email:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    phone:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.28l3-.09a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8 9.1a16 16 0 0 0 6.63 6.63l.71-.71a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 17z"/></svg>`,
  };
  return icons[name] || '';
}

window.t = t;
window.getLang = getLang;
window.setLang = setLang;
window.toast = toast;
window.svgIcon = svgIcon;
window.initNavbar = initNavbar;
window.initFooter = initFooter;
window.initReveal = initReveal;
window.initScrollProgress = initScrollProgress;

// ── Bootstrap ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Use SSR data if available (no flash)
  if (window.__SSR_DATA__ && window.__SSR_DATA__.settings) {
    window._settings = window.__SSR_DATA__.settings;
  } else {
    // Fallback to API fetch (may cause flash on slow connections)
    try {
      window._settings = await api.getSettings();
    } catch {
      window._settings = {};
    }
  }

  const siteTitle = getLang() === 'ar' ? window._settings.site_title_ar : window._settings.site_title_en;
  if (siteTitle) document.title = siteTitle;

  applyLang(getLang());
  await initNavbar();
  initFooter();
  initScrollProgress();
  initReveal();
});
