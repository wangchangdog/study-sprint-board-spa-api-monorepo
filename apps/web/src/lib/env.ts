const enableApi = import.meta.env.VITE_ENABLE_API === 'true'
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

if (enableApi && !apiBaseUrl) {
  throw new Error('VITE_ENABLE_API=true のときは VITE_API_BASE_URL が必要です。')
}

export const env = {
  enableApi,
  apiBaseUrl,
} as const
