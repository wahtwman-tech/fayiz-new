/**
 * API Client — shared across all pages
 */

const API_BASE = '/api';

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
  // Settings
  getSettings: ()              => apiFetch('/settings'),
  updateSettings: (data)       => apiFetch('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Auth
  login: (username, password)  => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: ()                       => apiFetch('/auth/me'),
  changePassword: (d)          => apiFetch('/auth/change-password', { method: 'POST', body: JSON.stringify(d) }),

  // Nav
  getNav: ()                   => apiFetch('/nav'),
  createNav: (d)               => apiFetch('/nav', { method: 'POST', body: JSON.stringify(d) }),
  updateNav: (id, d)           => apiFetch(`/nav/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteNav: (id)              => apiFetch(`/nav/${id}`, { method: 'DELETE' }),

  // Pages
  getPages: ()                 => apiFetch('/pages'),
  getPage: (slug)              => apiFetch(`/pages/${slug}`),
  createPage: (d)              => apiFetch('/pages', { method: 'POST', body: JSON.stringify(d) }),
  updatePage: (id, d)          => apiFetch(`/pages/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deletePage: (id)             => apiFetch(`/pages/${id}`, { method: 'DELETE' }),

  // Sections
  getSections: (pageKey)       => apiFetch(`/sections${pageKey ? `?pageKey=${pageKey}` : ''}`),
  updateSection: (id, d)       => apiFetch(`/sections/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  createSection: (d)           => apiFetch('/sections', { method: 'POST', body: JSON.stringify(d) }),

  // Services
  getServices: ()              => apiFetch('/services'),
  createService: (d)           => apiFetch('/services', { method: 'POST', body: JSON.stringify(d) }),
  updateService: (id, d)       => apiFetch(`/services/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteService: (id)          => apiFetch(`/services/${id}`, { method: 'DELETE' }),

  // Projects
  getProjects: (featured)      => apiFetch(`/projects${featured ? '?featured=true' : ''}`),
  getProject: (id)             => apiFetch(`/projects/${id}`),
  createProject: (d)           => apiFetch('/projects', { method: 'POST', body: JSON.stringify(d) }),
  updateProject: (id, d)       => apiFetch(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteProject: (id)          => apiFetch(`/projects/${id}`, { method: 'DELETE' }),

  // Project images — uses FormData
  uploadProjectImage: (projectId, formData) => {
    const token = localStorage.getItem('cms_token');
    return fetch(`${API_BASE}/projects/${projectId}/images`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(new Error(e.error))));
  },
  deleteProjectImage: (projectId, imageId) => apiFetch(`/projects/${projectId}/images/${imageId}`, { method: 'DELETE' }),

  // Contact
  sendContact: (d)             => apiFetch('/contact', { method: 'POST', body: JSON.stringify(d) }),
};

window.api = api;
