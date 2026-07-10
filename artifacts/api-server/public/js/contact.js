/**
 * Contact page JS
 */

document.addEventListener('DOMContentLoaded', async () => {
  const lang = getLang();
  const settings = window._settings || {};

  // Contact intro
  try {
    const sections = await api.getSections('contact');
    const introKey = lang === 'ar' ? 'intro_ar' : 'intro_en';
    const intro = sections.find(s => s.sectionKey === introKey);
    if (intro) {
      const content = lang === 'ar' ? intro.contentAr : (intro.contentEn || intro.contentAr);
      if (content) document.getElementById('contact-intro').textContent = content;
    }
  } catch {}

  // Contact info items
  const infoEl = document.getElementById('contact-info-items');
  const items = [];

  if (settings.contact_email) {
    items.push({
      icon: svgIcon('email'),
      label: lang === 'ar' ? 'البريد الإلكتروني' : 'Email',
      value: settings.contact_email,
      href: `mailto:${settings.contact_email}`,
    });
  }
  if (settings.contact_phone) {
    items.push({
      icon: svgIcon('phone'),
      label: lang === 'ar' ? 'الهاتف' : 'Phone',
      value: settings.contact_phone,
      href: `tel:${settings.contact_phone}`,
    });
  }
  if (settings.contact_whatsapp) {
    items.push({
      icon: svgIcon('whatsapp'),
      label: 'WhatsApp',
      value: settings.contact_whatsapp,
      href: `https://wa.me/${settings.contact_whatsapp.replace(/\D/g, '')}`,
    });
  }

  infoEl.innerHTML = items.map(item => `
    <a href="${item.href}" target="${item.href.startsWith('http') ? '_blank' : '_self'}" class="contact-info-item">
      <div class="contact-info-icon">${item.icon}</div>
      <div>
        <div class="contact-info-label">${item.label}</div>
        <div class="contact-info-value">${item.value}</div>
      </div>
    </a>`).join('');

  // Social
  const socialEl = document.getElementById('contact-social');
  const socials = [
    { key: 'contact_whatsapp', icon: svgIcon('whatsapp') },
    { key: 'contact_telegram', icon: svgIcon('telegram') },
    { key: 'contact_facebook', icon: svgIcon('facebook') },
    { key: 'contact_email', icon: svgIcon('email') },
  ];
  socialEl.innerHTML = socials
    .filter(s => settings[s.key])
    .map(s => {
      const value = settings[s.key];
      let href = value;
      if (s.key === 'contact_whatsapp') href = `https://wa.me/${value.replace(/\D/g, '')}`;
      else if (s.key === 'contact_telegram') href = `https://t.me/${value.replace(/\D/g, '')}`;
      else if (s.key === 'contact_facebook') href = `https://fb.com/${value}`;
      else if (s.key === 'contact_email') href = `mailto:${value}`;
      return `<a href="${href}" target="_blank" rel="noopener" class="social-btn">${s.icon}</a>`;
    })
    .join('');

  // Form submission
  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('contact-submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name    = document.getElementById('contact-name').value.trim();
    const email   = document.getElementById('contact-email').value.trim();
    const phone   = document.getElementById('contact-phone').value.trim();
    const message = document.getElementById('contact-message').value.trim();

    if (!name || !email || !message) {
      toast(lang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<div class="spinner" style="width:18px;height:18px;border-width:2px;"></div>`;

    try {
      await api.sendContact({ name, email, phone, message });
      toast(lang === 'ar' ? 'تم إرسال رسالتك بنجاح! سأتواصل معك قريباً.' : 'Message sent successfully! I will contact you soon.', 'success');
      form.reset();
    } catch (err) {
      toast(err.message || (lang === 'ar' ? 'حدث خطأ. يرجى المحاولة مرة أخرى.' : 'An error occurred. Please try again.'), 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span data-ar="إرسال الرسالة" data-en="Send Message">${lang === 'ar' ? 'إرسال الرسالة' : 'Send Message'}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
    }
  });
});
