/**
 * Admin Pages Management
 */

let editingPageId = null;

async function loadPages() {
  try {
    const pages = await api.getPages();
    const tbody = document.getElementById('pages-tbody');
    if (!pages.length) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px;color:var(--text-muted);">لا توجد صفحات مخصصة.</td></tr>';
      return;
    }
    tbody.innerHTML = pages.map(p => `
      <tr>
        <td class="td-primary">${p.titleAr || p.titleEn || '—'}</td>
        <td><code style="background:rgba(255,255,255,.05);padding:2px 8px;border-radius:4px;font-size:.8rem;color:var(--accent)">${p.slug}</code></td>
        <td><span class="badge ${p.isPublished ? 'badge--success' : 'badge--muted'}">${p.isPublished ? 'منشور' : 'مسودة'}</span></td>
        <td>
          <div class="table-actions">
            <button class="action-btn edit" onclick="editPage(${p.id})" title="تعديل">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            ${!p.isSystem ? `<button class="action-btn delete" onclick="deletePage(${p.id})" title="حذف">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>` : ''}
          </div>
        </td>
      </tr>`).join('');
  } catch {
    toast('فشل تحميل الصفحات', 'error');
  }
}

let _pagesCache = [];

async function editPage(id) {
  try {
    if (!_pagesCache.length) _pagesCache = await api.getPages();
    const p = _pagesCache.find(p => p.id === id);
    if (!p) return;
    editingPageId = id;
    document.getElementById('page-modal-title').textContent = 'تعديل الصفحة';
    document.getElementById('pg-titleAr').value = p.titleAr || '';
    document.getElementById('pg-titleEn').value = p.titleEn || '';
    document.getElementById('pg-slug').value = p.slug || '';
    document.getElementById('pg-contentAr').value = p.contentAr || '';
    document.getElementById('pg-contentEn').value = p.contentEn || '';
    initToggle(document.getElementById('pg-published-toggle'), p.isPublished);
    initToggle(document.getElementById('pg-nav-toggle'), false);
    document.getElementById('page-modal').style.display = 'flex';
  } catch {}
}

async function deletePage(id) {
  if (!confirm('هل أنت متأكد من حذف هذه الصفحة؟')) return;
  try {
    await api.deletePage(id);
    toast('تم حذف الصفحة', 'success');
    _pagesCache = [];
    loadPages();
  } catch (err) {
    toast(err.message || 'فشل الحذف', 'error');
  }
}

function closePageModal() {
  editingPageId = null;
  document.getElementById('page-modal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  loadPages();

  document.getElementById('add-page-btn').addEventListener('click', () => {
    editingPageId = null;
    document.getElementById('page-modal-title').textContent = 'صفحة جديدة';
    document.getElementById('pg-titleAr').value = '';
    document.getElementById('pg-titleEn').value = '';
    document.getElementById('pg-slug').value = '';
    document.getElementById('pg-contentAr').value = '';
    document.getElementById('pg-contentEn').value = '';
    initToggle(document.getElementById('pg-published-toggle'), false);
    initToggle(document.getElementById('pg-nav-toggle'), false);
    document.getElementById('page-modal').style.display = 'flex';
  });

  document.getElementById('save-page-btn').addEventListener('click', async () => {
    const titleAr = document.getElementById('pg-titleAr').value.trim();
    const slug = document.getElementById('pg-slug').value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!titleAr || !slug) { toast('العنوان والمعرّف مطلوبان', 'error'); return; }

    const data = {
      titleAr,
      titleEn: document.getElementById('pg-titleEn').value.trim(),
      slug,
      contentAr: document.getElementById('pg-contentAr').value.trim(),
      contentEn: document.getElementById('pg-contentEn').value.trim(),
      isPublished: getToggleValue(document.getElementById('pg-published-toggle')),
      addToNav: getToggleValue(document.getElementById('pg-nav-toggle')),
    };

    try {
      if (editingPageId) {
        await api.updatePage(editingPageId, data);
        toast('تم تحديث الصفحة', 'success');
      } else {
        await api.createPage(data);
        toast('تم إنشاء الصفحة', 'success');
      }
      closePageModal();
      _pagesCache = [];
      loadPages();
    } catch (err) {
      toast(err.message || 'فشل حفظ الصفحة', 'error');
    }
  });
});
