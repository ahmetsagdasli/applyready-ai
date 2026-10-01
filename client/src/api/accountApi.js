import apiClient from './client.js';

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function triggerBrowserDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// Kullanicinin verilerini JSON dosyasi olarak indirir.
export async function exportAccountData(token) {
  const res = await apiClient.get('/account/export', {
    headers: authHeaders(token),
    responseType: 'blob',
  });
  triggerBrowserDownload(res.data, 'applyready-account-export.json');
}

export async function deleteAppData(token) {
  const { data } = await apiClient.delete('/account/app-data', {
    headers: authHeaders(token),
  });
  return data;
}

export async function deleteAccount(token) {
  const { data } = await apiClient.delete('/account', {
    headers: authHeaders(token),
  });
  return data;
}
