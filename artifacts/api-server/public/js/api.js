/**
 * API Client — shared across all pages
 * Uses SSR data when available (window.__SSR_DATA__), falls back to API
 */

const API_BASE = '/api';

// Get SSR data if available
function getSSRData() {
  return window.__SSR_DATA__ || null;
}

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('cms_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let err;
    try { err = await res.json(); } catch { err = {}; }
    throw new Error(err.error || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

const api = {
  // Settings - use SSR data if available
  getSettings: () => {
    const ssr = getSSRData();
    if (ssr && ssr.settings) {
      return Promise.resolve(ssr.settings);
    }
    return apiFetch('/settings');
  },

  // Nav - use SSR data if available
  getNav: () => {
    const ssr = getSSRData();
    if (ssr && ssr.nav) {
      return Promise.resolve(ssr.nav);
    }
    return apiFetch('/nav');
  },

  // Services - use SSR data if available
  getServices: () => {
    const ssr = getSSRData();
    if (ssr && ssr.services) {
      return Promise.resolve(ssr.services);
    }
    return apiFetch('/services');
  },

  // Projects - always use API for fresh data
  getProjects: (featured) => {
    return apiFetch('/projects' + (featured ? '?featured=true' : ''));
  },

  // Other methods always use API
  updateSettings: (data) => apiFetch('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  uploadLogo: (file) => {
    const token = localStorage.getItem('cms_token');
    const formData = new FormData();
    formData.append('logo', file);
    return fetch(API_BASE + '/settings/logo', {
      method: 'POST',
      headers: token ? { 'Authorization': 'Bearer ' + token } : {},
      body: formData,
    }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(new Error(e.error))));
  },
  uploadAboutCover: (file) => {
    const token = localStorage.getItem('cms_token');
    const formData = new FormData();
    formData.append('image', file);
    return fetch(API_BASE + '/settings/about-cover', {
      method: 'POST',
      headers: token ? { 'Authorization': 'Bearer ' + token } : {},
      body: formData,
    }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(new Error(e.error))));
  },
  login: (username, password) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => apiFetch('/auth/me'),
  changePassword: (d) => apiFetch('/auth/change-password', { method: 'POST', body: JSON.stringify(d) }),
  createNav: (d) => apiFetch('/nav', { method: 'POST', body: JSON.stringify(d) }),
  updateNav: (id, d) => apiFetch('/nav/' + id, { method: 'PUT', body: JSON.stringify(d) }),
  deleteNav: (id) => apiFetch('/nav/' + id, { method: 'DELETE' }),
  getPages: () => apiFetch('/pages'),
  getPage: (slug) => apiFetch('/pages/' + slug),
  createPage: (d) => apiFetch('/pages', { method: 'POST', body: JSON.stringify(d) }),
  updatePage: (id, d) => apiFetch('/pages/' + id, { method: 'PUT', body: JSON.stringify(d) }),
  deletePage: (id) => apiFetch('/pages/' + id, { method: 'DELETE' }),
  getSections: (pageKey) => apiFetch('/sections' + (pageKey ? '?pageKey=' + pageKey : '')),
  updateSection: (id, d) => apiFetch('/sections/' + id, { method: 'PUT', body: JSON.stringify(d) }),
  createSection: (d) => apiFetch('/sections', { method: 'POST', body: JSON.stringify(d) }),
  createService: (d) => apiFetch('/services', { method: 'POST', body: JSON.stringify(d) }),
  updateService: (id, d) => apiFetch('/services/' + id, { method: 'PUT', body: JSON.stringify(d) }),
  deleteService: (id) => apiFetch('/services/' + id, { method: 'DELETE' }),
  getProject: (id) => apiFetch('/projects/' + id),
  createProject: (d) => apiFetch('/projects', { method: 'POST', body: JSON.stringify(d) }),
  updateProject: (id, d) => apiFetch('/projects/' + id, { method: 'PUT', body: JSON.stringify(d) }),
  deleteProject: (id) => apiFetch('/projects/' + id, { method: 'DELETE' }),
  uploadProjectImage: (projectId, formData) => {
    const token = localStorage.getItem('cms_token');
    return fetch(API_BASE + '/projects/' + projectId + '/images', {
      method: 'POST',
      headers: token ? { 'Authorization': 'Bearer ' + token } : {},
      body: formData,
    }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(new Error(e.error))));
  },
  uploadProjectCoverImage: (projectId, formData) => {
    const token = localStorage.getItem('cms_token');
    return fetch(API_BASE + '/projects/' + projectId + '/cover', {
      method: 'POST',
      headers: token ? { 'Authorization': 'Bearer ' + token } : {},
      body: formData,
    }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(new Error(e.error))));
  },
  deleteProjectImage: (projectId, imageId) => apiFetch('/projects/' + projectId + '/images/' + imageId, { method: 'DELETE' }),
  sendContact: (d) => apiFetch('/contact', { method: 'POST', body: JSON.stringify(d) }),
};

window.api = api;
window.getSSRData = getSSRData;
