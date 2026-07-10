/**
 * Admin Projects Management
 */

let deleteProjectId = null;

async function loadProjects() {
  try {
    const projects = await api.getProjects(false);
    const tbody = document.getElementById('projects-tbody');
    const countEl = document.getElementById('projects-count');
    countEl.textContent = `${projects.length} مشروع`;

    if (!projects.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">لا توجد مشاريع. أضف مشروعك الأول!</td></tr>';
      return;
    }

    tbody.innerHTML = projects.map(p => {
      const techs = (p.technologies || []).slice(0, 3).map(t => `<span class="badge badge--accent">${t}</span>`).join(' ');
      return `
        <tr>
          <td class="td-primary">${p.titleAr || p.titleEn || '—'}</td>
          <td style="color:var(--text-secondary)">${p.category || '—'}</td>
          <td>${techs}</td>
          <td><span class="badge ${p.isPublished ? 'badge--success' : 'badge--muted'}">${p.isPublished ? 'منشور' : 'مسودة'}</span></td>
          <td><span class="badge ${p.isFeatured ? 'badge--accent' : 'badge--muted'}">${p.isFeatured ? '★ مميز' : 'عادي'}</span></td>
          <td>
            <div class="table-actions">
              <a href="/admin/project-edit.html?id=${p.id}" class="action-btn edit" title="تعديل">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </a>
              <a href="/project.html?id=${p.id}" target="_blank" class="action-btn" title="عرض">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
              <button class="action-btn delete" onclick="confirmDelete(${p.id})" title="حذف">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </button>
            </div>
          </td>
        </tr>`;
    }).join('');
  } catch (err) {
    toast('فشل تحميل المشاريع', 'error');
  }
}

function confirmDelete(id) {
  deleteProjectId = id;
  document.getElementById('delete-modal').style.display = 'flex';
}

function closeDeleteModal() {
  deleteProjectId = null;
  document.getElementById('delete-modal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  loadProjects();

  document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
    if (!deleteProjectId) return;
    try {
      await api.deleteProject(deleteProjectId);
      toast('تم حذف المشروع بنجاح', 'success');
      closeDeleteModal();
      loadProjects();
    } catch (err) {
      toast(err.message || 'فشل حذف المشروع', 'error');
    }
  });
});
