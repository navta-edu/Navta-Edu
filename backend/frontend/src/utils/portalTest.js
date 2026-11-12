const storageKey = 'navta-portal-test-role';
export const portalTestHeader = 'X-Navta-Portal-Test';

export function setPortalTestRole(role) {
  if (role === 'student' || role === 'teacher') {
    sessionStorage.setItem(storageKey, role);
  } else {
    sessionStorage.removeItem(storageKey);
  }
}

export function getPortalTestHeaders() {
  const role = sessionStorage.getItem(storageKey);
  return role === 'student' || role === 'teacher' ? { [portalTestHeader]: role } : {};
}

export function getAuthenticatedHeaders(headers = {}) {
  const token = localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('accessToken');

  return token
    ? { ...headers, Authorization: 'Bearer ' + token, ...getPortalTestHeaders() }
    : headers;
}
