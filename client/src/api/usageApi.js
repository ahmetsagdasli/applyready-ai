import apiClient from './client.js';

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getUsageSummary(token) {
  const { data } = await apiClient.get('/usage/summary', {
    headers: authHeaders(token),
  });
  return data;
}
