/**
 * Admin Services Management
 */

let editingServiceId = null;

async function loadServices() {
  try {
    const services = await api.getServices();
    const tbody = document.getElementById('services-tbody');
    if (!services.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted);">لا توجد خدمات. أضف خدمتك الأولى!</td></tr>';
      return;
    }
    tbody.innerHTML = services.map(s => `
      <tr>
        <td class="td-primary">${s.titleAr || s.titleEn || '—'}</td>
        <td style="color:var(--text-secondary)">${s.icon || '—'}</td>
        <td><span class="badge ${s.isActive ? 'badge--success' : 'badge--muted'}">${s.isActive ? 'مفعّل' : 'معطّل'}</span></td>
        <td style="color:var(--text-secondary)">${s.sortOrder}</td>
        <td>
          <div class="table-actions">
            <button class="action-btn edit" onclick="editService(${s.id})" title="تعديل">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="action-btn delete" onclick="deleteService(${s.id})" title="حذف">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
        </td>
      </tr>`).join('');
  } catch {
    toast('فشل تحميل الخدمات', 'error');
  }
}

function openServiceModal(service = null) {
  editingServiceId = service?.id || null;
  document.getElementById('service-modal-title').textContent = service ? 'تعديل الخدمة' : 'خدمة جديدة';
  document.getElementById('svc-titleAr').value = service?.titleAr || '';
  document.getElementById('svc-titleEn').value = service?.titleEn || '';
  document.getElementById('svc-descAr').value = service?.descriptionAr || '';
  document.getElementById('svc-descEn').value = service?.descriptionEn || '';
  document.getElementById('svc-icon').value = service?.icon || 'code';
  document.getElementById('svc-order').value = service?.sortOrder || 0;
  initToggle(document.getElementById('svc-active-toggle'), service?.isActive ?? true);
  document.getElementById('service-modal').style.display = 'flex';
}

function closeServiceModal() {
  editingServiceId = null;
  document.getElementById('service-modal').style.display = 'none';
}

async function editService(id) {
  try {
    const services = await api.getServices();
    const s = services.find(s => s.id === id);
    if (s) openServiceModal(s);
  } catch {}
}

async function deleteService(id) {
  if (!confirm('هل أنت متأكد من حذف هذه الخدمة؟')) return;
  try {
    await api.deleteService(id);
    toast('تم حذف الخدمة', 'success');
    loadServices();
  } catch (err) {
    toast(err.message || 'فشل الحذف', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadServices();

  document.getElementById('add-service-btn').addEventListener('click', () => openServiceModal());

  document.getElementById('save-service-btn').addEventListener('click', async () => {
    const titleAr = document.getElementById('svc-titleAr').value.trim();
    if (!titleAr) { toast('العنوان بالعربية مطلوب', 'error'); return; }

    const data = {
      titleAr,
      titleEn: document.getElementById('svc-titleEn').value.trim(),
      descriptionAr: document.getElementById('svc-descAr').value.trim(),
      descriptionEn: document.getElementById('svc-descEn').value.trim(),
      icon: document.getElementById('svc-icon').value,
      sortOrder: parseInt(document.getElementById('svc-order').value) || 0,
      isActive: getToggleValue(document.getElementById('svc-active-toggle')),
    };

    try {
      if (editingServiceId) {
        await api.updateService(editingServiceId, data);
        toast('تم تحديث الخدمة', 'success');
      } else {
        await api.createService(data);
        toast('تم إضافة الخدمة', 'success');
      }
      closeServiceModal();
      loadServices();
    } catch (err) {
      toast(err.message || 'فشل حفظ الخدمة', 'error');
    }
  });
});
