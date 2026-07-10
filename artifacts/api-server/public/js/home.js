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

// Gradient placeholders for projects without images
const GRAD_PLACEHOLDERS = [
  'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)',
  'linear-gradient(135deg,#0d1117 0%,#161b22 50%,#1c2128 100%)',
  'linear-gradient(135deg,#12121f 0%,#1a1a35 50%,#222244 100%)',
  'linear-gradient(135deg,#0a0a12 0%,#111122 50%,#1a1a33 100%)',
];

function renderProjectCard(project, lang, index = 0) {
  const title = lang === 'ar' ? project.titleAr : (project.titleEn || project.titleAr);
  const desc  = lang === 'ar' ? project.descriptionAr : (project.descriptionEn || project.descriptionAr);
  const primaryImage = project.images?.find(i => i.isPrimary) || project.images?.[0];
  const techs = (project.technologies || []).slice(0, 4).map(t => `<span class="project-tag">${t}</span>`).join('');

  const mediaHtml = primaryImage
    ? `<div class="project-card-media"><img src="/uploads/${primaryImage.filename}" alt="${title}" loading="lazy" /></div>`
    : `<div class="project-placeholder-bg" style="background:${GRAD_PLACEHOLDERS[index % GRAD_PLACEHOLDERS.length]}"><span class="project-placeholder-icon">🖥️</span></div>`;

  return `
    <article class="project-card reveal" onclick="location.href='/project.html?id=${project.id}'" role="button" aria-label="${title}">
      ${mediaHtml}
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
