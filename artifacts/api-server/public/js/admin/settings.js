/**
 * Admin Settings Page
 */

const SETTING_GROUPS = [
  {
    title: 'هوية الموقع',
    fields: [
      { key: 'site_title_ar', label: 'عنوان الموقع (عربي)', type: 'text' },
      { key: 'site_title_en', label: 'عنوان الموقع (إنجليزي)', type: 'text' },
      { key: 'site_description_ar', label: 'وصف الموقع (عربي)', type: 'textarea' },
      { key: 'site_description_en', label: 'وصف الموقع (إنجليزي)', type: 'textarea' },
      { key: 'logo_text_ar', label: 'نص الشعار (عربي) - للبديل', type: 'text' },
      { key: 'logo_text_en', label: 'نص الشعار (إنجليزي) - للبديل', type: 'text' },
    ],
  },
  {
    title: 'قسم الهيرو (الصفحة الرئيسية)',
    fields: [
      { key: 'hero_name_ar', label: 'الاسم (عربي)', type: 'text' },
      { key: 'hero_name_en', label: 'الاسم (إنجليزي)', type: 'text' },
      { key: 'hero_title_ar', label: 'المسمى الوظيفي (عربي)', type: 'text' },
      { key: 'hero_title_en', label: 'المسمى الوظيفي (إنجليزي)', type: 'text' },
      { key: 'hero_intro_ar', label: 'مقدمة الهيرو (عربي)', type: 'textarea' },
      { key: 'hero_intro_en', label: 'مقدمة الهيرو (إنجليزي)', type: 'textarea' },
    ],
  },
  {
    title: 'بيانات التواصل',
    fields: [
      { key: 'contact_email', label: 'البريد الإلكتروني', type: 'text' },
      { key: 'contact_phone', label: 'رقم الهاتف', type: 'text' },
      { key: 'contact_whatsapp', label: 'رقم الواتساب (مع كود الدولة)', type: 'text' },
    ],
  },
  {
    title: 'روابط التواصل الاجتماعي',
    fields: [
      { key: 'social_github', label: 'رابط GitHub', type: 'text' },
      { key: 'social_linkedin', label: 'رابط LinkedIn', type: 'text' },
      { key: 'social_twitter', label: 'رابط Twitter / X', type: 'text' },
    ],
  },
  {
    title: 'التذييل (Footer)',
    fields: [
      { key: 'footer_text_ar', label: 'نص التذييل (عربي)', type: 'text' },
      { key: 'footer_text_en', label: 'نص التذييل (إنجليزي)', type: 'text' },
    ],
  },
];

let currentSettings = {};

function renderSettings(settings) {
  const content = document.getElementById('settings-content');
  
  // Logo upload section
  const logoSection = `
    <div class="panel" style="margin-bottom:24px;">
      <div class="panel-header"><div class="panel-title">صورة الشعار</div></div>
      <div class="panel-body">
        <div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap;">
          <div style="width:120px;height:120px;border:2px dashed var(--border);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;background:var(--bg-secondary);overflow:hidden;" id="logo-preview">
            ${settings.logo_image && settings.logo_image.startsWith('data:') 
              ? `<img src="${settings.logo_image}" style="max-width:100%;max-height:100%;object-fit:contain;" />` 
              : settings.logo_image 
                ? `<img src="${settings.logo_image}" style="max-width:100%;max-height:100%;object-fit:contain;" />`
                : '<span style="color:var(--text-muted);font-size:0.8rem;">لم يتم رفع شعار</span>'
            }
          </div>
          <div>
            <input type="file" id="logo-file-input" accept="image/*" style="display:none;" />
            <button type="button" class="btn btn--outline" id="logo-upload-btn">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              رفع شعار جديد
            </button>
            <p style="color:var(--text-muted);font-size:0.75rem;margin-top:8px;">PNG, JPG, WebP - حجم أقصى 2MB</p>
          </div>
        </div>
      </div>
    </div>
  `;
  
  content.innerHTML = logoSection + SETTING_GROUPS.map(group => `
    <div class="panel" style="margin-bottom:24px;">
      <div class="panel-header"><div class="panel-title">${group.title}</div></div>
      <div class="panel-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          ${group.fields.map(f => `
            <div class="form-group">
              <label class="form-label">${f.label}</label>
              ${f.type === 'textarea'
                ? `<textarea class="form-textarea" id="setting-${f.key}" rows="2">${settings[f.key] || ''}</textarea>`
                : `<input type="text" class="form-input" id="setting-${f.key}" value="${(settings[f.key] || '').replace(/"/g, '&quot;')}" />`
              }
            </div>`).join('')}
        </div>
      </div>
    </div>`).join('') + `
    <div class="panel" style="margin-bottom:24px;">
      <div class="panel-header"><div class="panel-title">تغيير كلمة المرور</div></div>
      <div class="panel-body">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;">
          <div class="form-group">
            <label class="form-label">كلمة المرور الحالية</label>
            <input type="password" class="form-input" id="pwd-current" placeholder="••••••••" />
          </div>
          <div class="form-group">
            <label class="form-label">كلمة المرور الجديدة</label>
            <input type="password" class="form-input" id="pwd-new" placeholder="••••••••" />
          </div>
          <div class="form-group" style="display:flex;align-items:flex-end;">
            <button class="btn btn--outline btn--full" id="change-pwd-btn">تغيير كلمة المرور</button>
          </div>
        </div>
      </div>
    </div>`;

  // Password change
  document.getElementById('change-pwd-btn').addEventListener('click', async () => {
    const current = document.getElementById('pwd-current').value;
    const newPwd = document.getElementById('pwd-new').value;
    if (!current || !newPwd) {
      toast('يرجى إدخال كلمة المرور الحالية والجديدة', 'error');
      return;
    }
    try {
      await api.changePassword({ currentPassword: current, newPassword: newPwd });
      toast('تم تغيير كلمة المرور بنجاح', 'success');
      document.getElementById('pwd-current').value = '';
      document.getElementById('pwd-new').value = '';
    } catch (err) {
      toast(err.message || 'فشل تغيير كلمة المرور', 'error');
    }
  });
}

async function saveSettings() {
  const updates = {};
  SETTING_GROUPS.forEach(group => {
    group.fields.forEach(f => {
      const el = document.getElementById(`setting-${f.key}`);
      if (el) updates[f.key] = el.value;
    });
  });

  try {
    await api.updateSettings(updates);
    toast('تم حفظ الإعدادات بنجاح', 'success');
  } catch (err) {
    toast(err.message || 'فشل حفظ الإعدادات', 'error');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    currentSettings = await api.getSettings();
    renderSettings(currentSettings);
  } catch {
    toast('فشل تحميل الإعدادات', 'error');
  }

  // Logo upload
  const logoUploadBtn = document.getElementById('logo-upload-btn');
  const logoFileInput = document.getElementById('logo-file-input');
  const logoPreview = document.getElementById('logo-preview');
  
  if (logoUploadBtn && logoFileInput) {
    logoUploadBtn.addEventListener('click', () => logoFileInput.click());
    logoFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        await api.uploadLogo(file);
        // Update preview
        const reader = new FileReader();
        reader.onload = (ev) => {
          logoPreview.innerHTML = `<img src="${ev.target.result}" style="max-width:100%;max-height:100%;object-fit:contain;" />`;
        };
        reader.readAsDataURL(file);
        toast('تم رفع الشعار بنجاح', 'success');
      } catch (err) {
        toast(err.message || 'فشل رفع الشعار', 'error');
      }
    });
  }

  document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
});
