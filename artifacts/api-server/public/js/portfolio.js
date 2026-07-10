/**
 * Portfolio page
 */

let allProjects = [];
let activeFilter = 'all';

const GRAD_PLACEHOLDERS = [
  'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)',
  'linear-gradient(135deg,#0d1117 0%,#161b22 50%,#1c2128 100%)',
  'linear-gradient(135deg,#12121f 0%,#1a1a35 50%,#222244 100%)',
  'linear-gradient(135deg,#0a0a12 0%,#111122 50%,#1a1a33 100%)',
  'linear-gradient(135deg,#1a120b 0%,#2e1f0f 50%,#3d2b1b 100%)',
  'linear-gradient(135deg,#0b1a12 0%,#0f2e1f 50%,#1b3d2b 100%)',
];

function renderProjectCard(project, lang, index = 0) {
  const title = lang === 'ar' ? project.titleAr : (project.titleEn || project.titleAr);
  const desc  = lang === 'ar' ? project.descriptionAr : (project.descriptionEn || project.descriptionAr);
  const primaryImage = project.images?.find(i => i.isPrimary) || project.images?.[0];
  const techs = (project.technologies || []).slice(0, 5).map(t => `<span class="project-tag">${t}</span>`).join('');

  // Priority: 1. coverImageData (Base64) 2. coverImage (URL) 3. primaryImage 4. placeholder
  let mediaHtml;
  if (project.coverImageData) {
    mediaHtml = `<div class="project-card-media"><img src="${project.coverImageData}" alt="${title}" loading="lazy" /></div>`;
  } else if (project.coverImage) {
    mediaHtml = `<div class="project-card-media"><img src="${project.coverImage}" alt="${title}" loading="lazy" /></div>`;
  } else if (primaryImage) {
    mediaHtml = `<div class="project-card-media"><img src="/uploads/${primaryImage.filename}" alt="${title}" loading="lazy" /></div>`;
  } else {
    mediaHtml = `<div class="project-placeholder-bg" style="background:${GRAD_PLACEHOLDERS[index % GRAD_PLACEHOLDERS.length]}"><span class="project-placeholder-icon">🖥️</span></div>`;
  }

  return `
    <article class="project-card reveal" data-category="${project.category || ''}"
      onclick="location.href='/project.html?id=${project.id}'" role="button" aria-label="${title}">
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

function applyFilter(filter) {
  activeFilter = filter;
  const lang = getLang();
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === filter));
  const filtered = filter === 'all' ? allProjects : allProjects.filter(p => p.category === filter);
  const grid = document.getElementById('projects-grid');

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <p>${lang === 'ar' ? 'لا توجد مشاريع في هذه الفئة' : 'No projects in this category'}</p>
    </div>`;
    return;
  }

  // Remove bento on filtered (to avoid orphan wide card)
  if (filter !== 'all' || filtered.length < 2) {
    grid.classList.remove('projects-grid--bento');
  } else {
    grid.classList.add('projects-grid--bento');
  }

  grid.innerHTML = filtered.map((p, i) => renderProjectCard(p, lang, i)).join('');
  initReveal();
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const lang = getLang();
    const projects = await api.getProjects(false);
    allProjects = projects.filter(p => p.isPublished);

    // Build filters
    const categories = [...new Set(allProjects.map(p => p.category).filter(Boolean))];
    const filterBar = document.getElementById('filter-bar');
    const allLabel = lang === 'ar' ? 'الكل' : 'All';
    filterBar.innerHTML =
      `<button class="filter-btn active" data-filter="all">${allLabel}</button>` +
      categories.map(c => `<button class="filter-btn" data-filter="${c}">${c}</button>`).join('');

    filterBar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
    });

    applyFilter('all');
  } catch {
    document.getElementById('projects-grid').innerHTML =
      `<div class="empty-state" style="grid-column:1/-1"><p>Could not load projects.</p></div>`;
  }
});
