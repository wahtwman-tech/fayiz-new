/**
 * Single project detail page
 */

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const lang = getLang();
  const content = document.getElementById('project-content');

  if (!id) {
    content.innerHTML = `<div class="empty-state" style="min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;">
      <h3>${lang === 'ar' ? 'مشروع غير موجود' : 'Project Not Found'}</h3>
      <a href="/portfolio.html" class="btn btn--outline" style="margin-top:16px">${lang === 'ar' ? 'العودة للأعمال' : 'Back to Portfolio'}</a>
    </div>`;
    return;
  }

  try {
    const project = await api.getProject(id);
    const title     = lang === 'ar' ? project.titleAr     : (project.titleEn     || project.titleAr);
    const desc      = lang === 'ar' ? project.descriptionAr : (project.descriptionEn || project.descriptionAr);
    const problem   = lang === 'ar' ? project.problemAr   : (project.problemEn   || project.problemAr);
    const solution  = lang === 'ar' ? project.solutionAr  : (project.solutionEn  || project.solutionAr);

    document.title = `${title} | Portfolio`;

    const images = project.images || [];
    const primaryImage = images.find(i => i.isPrimary) || images[0];

    // Gallery
    const mainImgHtml = primaryImage
      ? `<img src="/uploads/${primaryImage.filename}" alt="${title}" id="gallery-main-img" />`
      : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:4rem;">🖥️</div>`;

    const thumbsHtml = images.length > 1
      ? images.map((img, i) => `
          <div class="gallery-thumb${i === 0 ? ' active' : ''}" data-src="/uploads/${img.filename}" onclick="switchImage(this, '/uploads/${img.filename}')">
            <img src="/uploads/${img.filename}" alt="${title}" />
          </div>`).join('')
      : '';

    const galleryHtml = images.length > 0 ? `
      <div class="project-detail-gallery">
        <div class="gallery-main">${mainImgHtml}</div>
        ${images.length > 1 ? `<div class="gallery-thumbs">${thumbsHtml}</div>` : ''}
      </div>` : '';

const technologies = Array.isArray(project.technologies)
  ? project.technologies
  : (project.technologies || '')
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

const techTags = technologies
  .map(t => `<span class="tech-tag">${t}</span>`)
  .join('');

    
    const backLabel = lang === 'ar' ? 'العودة للأعمال' : 'Back to Portfolio';
    const problemLabel = lang === 'ar' ? 'المشكلة' : 'The Problem';
    const solutionLabel = lang === 'ar' ? 'الحل' : 'The Solution';
    const techLabel = lang === 'ar' ? 'التقنيات المستخدمة' : 'Technologies Used';
    const categoryLabel = lang === 'ar' ? 'الفئة' : 'Category';
    const viewLiveLabel = lang === 'ar' ? 'عرض المشروع' : 'View Live';
    const viewCodeLabel = lang === 'ar' ? 'الكود المصدري' : 'Source Code';

    content.innerHTML = `
      <section class="project-detail-hero">
        <div class="container">
          <a href="/portfolio.html" class="btn btn--ghost btn--sm" style="margin-bottom:24px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            ${backLabel}
          </a>
          <span class="section-label">${project.category || ''}</span>
          <h1 style="font-size:clamp(2rem,5vw,3.5rem);font-weight:900;margin-bottom:16px;">${title}</h1>
          <p style="color:var(--text-secondary);font-size:1.1rem;max-width:700px;">${desc}</p>
          ${galleryHtml}
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="project-detail-grid">
            <div>
              ${problem ? `
                <div style="margin-bottom:40px;">
                  <h2 style="font-size:1.5rem;margin-bottom:16px;">🔍 ${problemLabel}</h2>
                  <p style="color:var(--text-secondary);line-height:1.9;">${problem}</p>
                </div>` : ''}
              ${solution ? `
                <div style="margin-bottom:40px;">
                  <h2 style="font-size:1.5rem;margin-bottom:16px;">💡 ${solutionLabel}</h2>
                  <p style="color:var(--text-secondary);line-height:1.9;">${solution}</p>
                </div>` : ''}
              ${techTags ? `
                <div>
                  <h2 style="font-size:1.5rem;margin-bottom:16px;">⚙️ ${techLabel}</h2>
                  <div class="project-tech-list" style="gap:10px;">${techTags}</div>
                </div>` : ''}
            </div>

            <div class="project-meta-card">
              ${project.category ? `
                <div class="project-meta-item">
                  <div class="project-meta-label">${categoryLabel}</div>
                  <div class="project-meta-value">${project.category}</div>
                </div>` : ''}
              <div class="project-meta-item">
                <div class="project-meta-label" style="margin-bottom:12px;">${lang === 'ar' ? 'روابط' : 'Links'}</div>
                <div style="display:flex;flex-direction:column;gap:8px;">
                  ${project.liveUrl ? `<a href="${project.liveUrl}" target="_blank" class="btn btn--primary btn--sm">${viewLiveLabel}</a>` : ''}
                  ${project.githubUrl ? `<a href="${project.githubUrl}" target="_blank" class="btn btn--outline btn--sm">${viewCodeLabel}</a>` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>`;

  } catch {
    content.innerHTML = `<div class="empty-state" style="min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;">
      <h3>${lang === 'ar' ? 'تعذر تحميل المشروع' : 'Could not load project'}</h3>
      <a href="/portfolio.html" class="btn btn--outline" style="margin-top:16px">${lang === 'ar' ? 'العودة' : 'Go Back'}</a>
    </div>`;
  }
});

function switchImage(thumbEl, src) {
  const mainImg = document.getElementById('gallery-main-img');
  if (mainImg) mainImg.src = src;
  document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
  thumbEl.classList.add('active');
}
