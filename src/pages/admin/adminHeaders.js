export function adminHeaders(token, password) {
  return token ? { Authorization: `Bearer ${token}` } : { 'x-admin-password': password || '' };
}

