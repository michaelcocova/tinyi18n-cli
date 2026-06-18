const DEFAULT_WEB_ROUTE_BASE = import.meta.env.BASE_URL || '/'
const DEFAULT_API_BASE = '/api'

function normalizeRouteBase(routeBase: string) {
  if (!routeBase) {
    return '/'
  }

  return routeBase.endsWith('/') ? routeBase : `${routeBase}/`
}

declare global {
  interface Window {
    __TINYI18N_WEB_CONFIG__?: TinyI18nWebConfig
  }
}

export function getWebConfig(): TinyI18nWebConfig {
  return (
    window.__TINYI18N_WEB_CONFIG__ ?? {
      apiBase: DEFAULT_API_BASE,
      routeBase: normalizeRouteBase(DEFAULT_WEB_ROUTE_BASE),
    }
  )
}
