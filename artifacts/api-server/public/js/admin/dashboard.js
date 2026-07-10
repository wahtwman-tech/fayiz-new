/**
 * Admin Dashboard
 */

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const [projects, services, pages] = await Promise.all([
      api.getProjects(false),
      api.getServices(),
      api.getPages(),
    ]);

    document.getElementById('stat-projects').textContent = projects.length;
    document.getElementById('stat-featured').textContent = projects.filter(p => p.isFeatured).length;
    document.getElementById('stat-services').textContent = services.filter(s => s.isActive).length;
    document.getElementById('stat-pages').textContent = pages.filter(p => p.isPublished).length;

    // Recent projects
    const tbody = document.getElementById('recent-projects-tbody');
    if (!projects.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--text-muted);">لا توجد مشاريع بعد</td></tr>';
      return;
    }

    tbody.innerHTML = projects.slice(0, 5).map(p => `
      <tr>
        <td class="td-primary">${p.titleAr || p.titleEn || '—'}</td>
        <td>${p.category || '—'}</td>
        <td>
          <span class="badge ${p.isPublished ? 'badge--success' : 'badge--muted'}">
            ${p.isPublished ? 'منشور' : 'مسودة'}
          </span>
        </td>
        <td>
          <span class="badge ${p.isFeatured ? 'badge--accent' : 'badge--muted'}">
            ${p.isFeatured ? 'مميز' : 'عادي'}
          </span>
        </td>
        <td>
          <div class="table-actions">
            <a href="/admin/project-edit.html?id=${p.id}" class="action-btn edit" title="تعديل">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </a>
          </div>
        </td>
      </tr>`).join('');
  } catch (err) {
    console.error(err);
  }
});
