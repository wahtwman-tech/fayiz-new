/**
 * Admin Auth — shared guard for all admin pages.
 * The admin layout starts hidden (visibility:hidden via CSS class "admin-hidden")
 * and is only revealed after a successful auth check.
 */

(function () {
  // Immediately hide the page to prevent flash of admin content
  document.documentElement.style.visibility = 'hidden';
})();

(async function checkAuth() {
  const token = localStorage.getItem('cms_token');
  if (!token) {
    location.replace('/admin/login.html');
    return;
  }
  try {
    const user = await api.me();
    // Reveal page — auth confirmed
    document.documentElement.style.visibility = '';

    // Set user info in sidebar
    const nameEl = document.getElementById('user-name');
    const avatarEl = document.getElementById('user-avatar');
    if (nameEl) nameEl.textContent = user.username;
    if (avatarEl) avatarEl.textContent = user.username[0].toUpperCase();
  } catch {
    // Token invalid — redirect immediately (page stays hidden)
    localStorage.removeItem('cms_token');
    location.replace('/admin/login.html');
  }
})();

// Logout
document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('cms_token');
      location.replace('/admin/login.html');
    });
  }
});

// ── Helpers available to all admin pages ──────────────────────────

function toast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${escHtml(message)}</span>`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

function initToggle(el, initialValue) {
  if (!el) return;
  if (initialValue) el.classList.add('on');
  else el.classList.remove('on');
  el.onclick = () => el.classList.toggle('on');
}

function getToggleValue(el) {
  return el?.classList.contains('on') ?? false;
}

/** Escape a string for safe insertion into HTML text content */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

window.toast = toast;
window.initToggle = initToggle;
window.getToggleValue = getToggleValue;
window.escHtml = escHtml;
