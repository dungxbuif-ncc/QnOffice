/**
 * Application Routes and Paths Constants
 * Centralized path definitions for the entire application
 */

export const PATHS = {
  ROOT: '/',

  AUTH: {
    BASE: '/auth',
    LOGIN: '/auth/login',
    CALLBACK: '/auth/callback',
    ERROR: '/auth/error',
  },

  DASHBOARD: {
    BASE: '/dashboard',
    BRANCHES: '/dashboard/branches',
    STAFF: '/dashboard/staff',
    CALENDAR: '/dashboard/calendar',
    PANTRY_MENU: '/dashboard/pantry-menu',
    PANTRY_TRANSACTIONS: '/dashboard/pantry-transactions',
    SCHEDULES: {
      BASE: '/dashboard/schedules',
      CLEANING: '/dashboard/schedules/cleaning',
      OPEN_TALK: '/dashboard/schedules/open-talk',
      HOLIDAY: '/dashboard/schedules/holiday',
    },
    HOLIDAYS: '/dashboard/holidays',
    OPENTALK: '/dashboard/opentalk',
    MANAGEMENT: {
      BASE: '/dashboard/management',
      OPENTALK_SWAPS: '/dashboard/management/opentalk-swaps',
      CLEANING_SWAPS: '/dashboard/management/cleaning-swaps',
      OPENTALK_SLIDES: '/dashboard/management/opentalk-slides',
    },
    PENALTIES: '/dashboard/penalties',
    MANAGE_PENALTIES: '/dashboard/manage-penalties',
    CHANNELS: '/dashboard/channels',
    AUDIT_LOGS: '/dashboard/audit-logs',
    SETTINGS: '/dashboard/settings',
  },

  API: {
    BASE: '',
    AUTH: {
      BASE: '/auth',
      ME: '/auth/me',
      LOGOUT: '/api/auth/logout',
      OAUTH_URL: '/auth/oauth/url',
      LOGIN_REDIRECT: '/auth/login', // BFF endpoint for server-side OAuth redirect
    },
    BRANCHES: '/branches',
    USERS: '/users',
    SCHEDULES: '/schedules',
    CAMPAIGNS: '/campaigns',
    CHANNELS: '/channels',
    HOLIDAYS: '/holidays',
    PENALTIES: '/penalties',
  },

  // Backend API paths (without /api prefix)
  BACKEND: {
    BASE: '',
    AUTH: {
      BASE: '/auth',
      ME: '/auth/me',
      LOGOUT: '/auth/logout',
      OAUTH_URL: '/auth/oauth/url',
    },
    BRANCHES: '/branches',
    USERS: '/users',
    SCHEDULES: '/schedules',
    CAMPAIGNS: '/campaigns',
    CHANNELS: '/channels',
    HOLIDAYS: '/holidays',
    PENALTIES: '/penalties',
  },
} as const;

/**
 * Public paths that don't require authentication
 */
export const PUBLIC_PATHS = [
  PATHS.AUTH.LOGIN,
  PATHS.AUTH.CALLBACK,
  PATHS.AUTH.ERROR,
  '/api/auth', // Full API auth path for middleware
] as const;

/**
 * Protected paths that require authentication
 */
export const PROTECTED_PATHS = [PATHS.DASHBOARD.BASE] as const;

/**
 * Static assets extensions
 */
export const STATIC_ASSETS = [
  '.ico',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.css',
  '.js',
  '.json',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
] as const;

/**
 * Utility functions for path operations
 */
export const PathUtils = {
  /**
   * Check if a path is public (doesn't require authentication)
   */
  isPublicPath: (pathname: string): boolean => {
    return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  },

  /**
   * Check if a path is protected (requires authentication)
   */
  isProtectedPath: (pathname: string): boolean => {
    return PROTECTED_PATHS.some((path) => pathname.startsWith(path));
  },

  /**
   * Check if a path is a static asset
   */
  isStaticAsset: (pathname: string): boolean => {
    return (
      STATIC_ASSETS.some((ext) => pathname.includes(ext)) ||
      pathname.startsWith('/_next/')
    );
  },

  /**
   * Get the redirect path for authenticated users
   */
  getDefaultAuthenticatedPath: (): string => {
    return PATHS.DASHBOARD.BASE;
  },

  /**
   * Get the redirect path for unauthenticated users
   */
  getDefaultUnauthenticatedPath: (): string => {
    return PATHS.AUTH.LOGIN;
  },
} as const;

export type PathKey = keyof typeof PATHS;
