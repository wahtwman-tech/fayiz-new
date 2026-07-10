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
      { key: 'logo_image', label: 'رابط صورة اللوجو', type: 'text', placeholder: 'https://example.com/logo.png' },
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
  content.innerHTML = SETTING_GROUPS.map(group => `
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

  document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
});
