import apiClient from './client.js';

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Checkout session olusturur ve kullaniciyi Stripe Checkout'a yonlendirir.
export async function createCheckoutSession(token, plan = 'pro') {
  const { data } = await apiClient.post(
    '/billing/create-checkout-session',
    { plan },
    { headers: authHeaders(token) }
  );
  if (data?.checkoutUrl) {
    window.location.href = data.checkoutUrl;
  }
  return data;
}

// Customer Portal session olusturur ve kullaniciyi Stripe Portal'a yonlendirir.
export async function createPortalSession(token) {
  const { data } = await apiClient.post(
    '/billing/create-portal-session',
    {},
    { headers: authHeaders(token) }
  );
  if (data?.portalUrl) {
    window.location.href = data.portalUrl;
  }
  return data;
}

export async function getBillingMe(token) {
  const { data } = await apiClient.get('/billing/me', {
    headers: authHeaders(token),
  });
  return data;
}
