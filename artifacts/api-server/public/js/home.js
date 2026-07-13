/**
 * Home page
 */

const SERVICE_ICONS = {
  globe:            `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  settings:         `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>`,
  briefcase:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  'shopping-cart':  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
  'layout-dashboard':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  server:           `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>`,
  code:             `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
};

// Category-based project icons (no images)
const PROJECT_ICONS = {
  // E-commerce / Store
  store: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  ecommerce: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
  shop: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  متجر: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  'متجر': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  
  // Personal / Portfolio
  personal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  portfolio: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  شخصي: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  'شخصي': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  
  // Company / Corporate
  company: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  corporate: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  شركة: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  'شركة': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  
  // Website
  website: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  موقع: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  'موقع': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  
  // Mobile App
  mobile: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
  تطبيق: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
  'تطبيق': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
  
  // Dashboard
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  
  // Blog
  blog: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  مدونة: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  'مدونة': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  
  // SaaS
  saas: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>`,
  
  // API
  api: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  
  // Default icon
  default: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
};

// Gradient backgrounds for project cards
const GRAD_BG = [
  'linear-gradient(135deg,#b8860b 0%,#d4a574 100%)',
  'linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)',
  'linear-gradient(135deg,#0d1117 0%,#161b22 100%)',
  'linear-gradient(135deg,#12121f 0%,#1a1a35 100%)',
];

function getProjectIcon(category) {
  if (!category) return PROJECT_ICONS.default;
  const cat = category.toLowerCase().trim();
  return PROJECT_ICONS[cat] || PROJECT_ICONS.default;
}

function renderProjectCard(project, lang, index = 0) {
  const title = lang === 'ar' ? project.titleAr : (project.titleEn || project.titleAr);
  const desc  = lang === 'ar' ? project.descriptionAr : (project.descriptionEn || project.descriptionAr);
  const techs = (project.technologies || []).slice(0, 4).map(t => `<span class="project-tag">${t}</span>`).join('');

  // Always use icon (no images for projects)
  const icon = getProjectIcon(project.category);
  const bg = GRAD_BG[index % GRAD_BG.length];

  return `
    <article class="project-card reveal" onclick="location.href='/project.html?id=${project.id}'" role="button" aria-label="${title}">
      <div class="project-card-icon" style="background:${bg}">
        <div class="project-icon-wrapper">${icon}</div>
      </div>
      <div class="project-card-overlay">
        ${project.category ? `<div class="project-card-cat">${project.category}</div>` : ''}
        <h3 class="project-card-title">${title}</h3>
        ${desc ? `<p class="project-card-desc">${desc}</p>` : ''}
        ${techs ? `<div class="project-card-tags">${techs}</div>` : ''}
      </div>
      <div class="project-card-arrow">→</div>
    </article>`;
}

document.addEventListener('DOMContentLoaded', async () => {
  const lang = getLang();
  const settings = window._settings || {};

  // Hero content
  const heroName  = lang === 'ar' ? settings.hero_name_ar  : (settings.hero_name_en  || settings.hero_name_ar);
  const heroTitle = lang === 'ar' ? settings.hero_title_ar : (settings.hero_title_en || settings.hero_title_ar);
  const heroIntro = lang === 'ar' ? settings.hero_intro_ar : (settings.hero_intro_en || settings.hero_intro_ar);
  if (heroName)  document.getElementById('hero-name').textContent = heroName;
  if (heroTitle) document.getElementById('hero-title').textContent = heroTitle;
  if (heroIntro) document.getElementById('hero-intro').textContent = heroIntro;

  // About brief
  try {
    const sections = await api.getSections('home');
    const brief = sections.find(s => s.sectionKey === (lang === 'ar' ? 'about_brief_ar' : 'about_brief_en'));
    if (brief) {
      const content = lang === 'ar' ? brief.contentAr : (brief.contentEn || brief.contentAr);
      if (content) document.getElementById('about-brief-text').textContent = content;
    }
  } catch {}

  // About cover image
  try {
    const settings = await api.getSettings();
    if (settings.about_cover_image && settings.about_cover_image.startsWith('data:')) {
      const img = document.getElementById('about-cover-img');
      if (img) {
        img.src = settings.about_cover_image;
        img.style.display = 'block';
        const placeholder = img.nextElementSibling;
        if (placeholder) placeholder.style.display = 'none';
      }
    }
  } catch {}

  // Featured projects
  try {
    const projects = await api.getProjects(true);
    const grid = document.getElementById('featured-projects-grid');
    if (!projects.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p data-ar="لا توجد مشاريع مميزة" data-en="No featured projects yet">لا توجد مشاريع مميزة</p></div>`;
    } else {
      grid.innerHTML = projects.slice(0, 5).map((p, i) => renderProjectCard(p, lang, i)).join('');
      initReveal();
    }
  } catch {
    document.getElementById('featured-projects-grid').innerHTML = '';
  }

  // Services
  try {
    const services = await api.getServices();
    const grid = document.getElementById('services-grid');
    const active = services.filter(s => s.isActive).slice(0, 6);
    if (!active.length) { grid.innerHTML = ''; return; }
    grid.innerHTML = active.map(s => {
      const title = lang === 'ar' ? s.titleAr : (s.titleEn || s.titleAr);
      const desc  = lang === 'ar' ? s.descriptionAr : (s.descriptionEn || s.descriptionAr);
      const icon  = SERVICE_ICONS[s.icon] || SERVICE_ICONS.code;
      return `
        <div class="service-card reveal">
          <div class="service-icon">${icon}</div>
          <div class="service-title">${title}</div>
          <div class="service-desc">${desc || ''}</div>
        </div>`;
    }).join('');
    initReveal();
  } catch {
    document.getElementById('services-grid').innerHTML = '';
  }

  // Footer extras
  try {
    const navItems = await api.getNav();
    const fl = document.getElementById('footer-links');
    if (fl) fl.innerHTML = navItems.filter(n => n.isActive).map(n => {
      const label = lang === 'ar' ? n.labelAr : (n.labelEn || n.labelAr);
      return `<a href="${n.url}">${label}</a>`;
    }).join('');
  } catch {}

  const fc = document.getElementById('footer-contact');
  if (fc && settings) {
    fc.innerHTML = [
      settings.contact_email ? `<div>${settings.contact_email}</div>` : '',
      settings.contact_phone ? `<div>${settings.contact_phone}</div>` : '',
    ].join('');
  }

  initReveal();
});
