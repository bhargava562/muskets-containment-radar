/**
 * Normalizes and returns the active backend API base URL.
 * Automatically guarantees a leading protocol (https:// for remote origins, http:// for localhost)
 * and strips any trailing slashes to eliminate relative path routing errors on production hosts.
 */
export function getBackendUrl() {
  let url = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'
  if (typeof url === 'string') {
    url = url.trim().replace(/\/+$/, '')
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.startsWith('localhost') || url.startsWith('127.0.0.1')) {
        url = `http://${url}`
      } else {
        url = `https://${url}`
      }
    }
  }
  return url
}
