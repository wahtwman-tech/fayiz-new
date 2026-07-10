/**
 * Admin Navigation Management
 */

let editingNavId = null;

async function loadNav() {
  try {
    const items = await api.getNav();
    const tbody = document.getElementById('nav-tbody');
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">لا توجد روابط.</td></tr>';
      return;
    }
    tbody.innerHTML = items.map(n => `
      <tr>
        <td class="td-primary">${n.labelAr || '—'}</td>
        <td style="color:var(--text-secondary)">${n.labelEn || '—'}</td>
        <td><code style="background:rgba(255,255,255,.05);padding:2px 8px;border-radius:4px;font-size:.8rem;color:var(--accent)">${n.url}</code></td>
        <td><span class="badge ${n.isActive ? 'badge--success' : 'badge--muted'}">${n.isActive ? 'مفعّل' : 'معطّل'}</span></td>
        <td style="color:var(--text-secondary)">${n.sortOrder}</td>
        <td>
          <div class="table-actions">
            <button class="action-btn edit" onclick="editNavItem(${n.id})" title="تعديل">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="action-btn delete" onclick="deleteNavItem(${n.id})" title="حذف">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
        </td>
      </tr>`).join('');
  } catch {
    toast('فشل تحميل قائمة التنقل', 'error');
  }
}

let _navCache = [];

async function editNavItem(id) {
  try {
    if (!_navCache.length) _navCache = await api.getNav();
    const n = _navCache.find(n => n.id === id);
    if (!n) return;
    editingNavId = id;
    document.getElementById('nav-modal-title').textContent = 'تعديل الرابط';
    document.getElementById('nav-labelAr').value = n.labelAr || '';
    document.getElementById('nav-labelEn').value = n.labelEn || '';
    document.getElementById('nav-url').value = n.url || '';
    document.getElementById('nav-target').value = n.target || '_self';
    document.getElementById('nav-order').value = n.sortOrder || 0;
    initToggle(document.getElementById('nav-active-toggle'), n.isActive);
    document.getElementById('nav-modal').style.display = 'flex';
  } catch {}
}

async function deleteNavItem(id) {
  if (!confirm('هل أنت متأكد من حذف هذا الرابط؟')) return;
  try {
    await api.deleteNav(id);
    toast('تم حذف الرابط', 'success');
    _navCache = [];
    loadNav();
  } catch (err) {
    toast(err.message || 'فشل الحذف', 'error');
  }
}

function closeNavModal() {
  editingNavId = null;
  document.getElementById('nav-modal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  loadNav();

  document.getElementById('add-nav-btn').addEventListener('click', () => {
    editingNavId = null;
    document.getElementById('nav-modal-title').textContent = 'رابط جديد';
    document.getElementById('nav-labelAr').value = '';
    document.getElementById('nav-labelEn').value = '';
    document.getElementById('nav-url').value = '';
    document.getElementById('nav-target').value = '_self';
    document.getElementById('nav-order').value = 0;
    initToggle(document.getElementById('nav-active-toggle'), true);
    document.getElementById('nav-modal').style.display = 'flex';
  });

  document.getElementById('save-nav-btn').addEventListener('click', async () => {
    const labelAr = document.getElementById('nav-labelAr').value.trim();
    const url = document.getElementById('nav-url').value.trim();
    if (!labelAr || !url) { toast('العنوان والرابط مطلوبان', 'error'); return; }

    const data = {
      labelAr,
      labelEn: document.getElementById('nav-labelEn').value.trim(),
      url,
      target: document.getElementById('nav-target').value,
      sortOrder: parseInt(document.getElementById('nav-order').value) || 0,
      isActive: getToggleValue(document.getElementById('nav-active-toggle')),
    };

    try {
      if (editingNavId) {
        await api.updateNav(editingNavId, data);
        toast('تم تحديث الرابط', 'success');
      } else {
        await api.createNav(data);
        toast('تم إضافة الرابط', 'success');
      }
      closeNavModal();
      _navCache = [];
      loadNav();
    } catch (err) {
      toast(err.message || 'فشل حفظ الرابط', 'error');
    }
  });
});
