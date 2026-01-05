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
    SCHEDULES: {
      BASE: '/dashboard/schedules',
      CLEANING: '/dashboard/schedules/cleaning',
      OPEN_TALK: '/dashboard/schedules/open-talk',
      HOLIDAY: '/dashboard/schedules/holiday',
    },
    REPORTS: '/dashboard/reports',
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
 * Navigation items for sidebar/menu components
 */
export const NAVIGATION = {
  MAIN: [
    {
      title: 'Dashboard',
      href: PATHS.DASHBOARD.BASE,
      icon: 'dashboard',
    },
    {
      title: 'Branches',
      href: PATHS.DASHBOARD.BRANCHES,
      icon: 'building',
    },
    {
      title: 'Staff',
      href: PATHS.DASHBOARD.STAFF,
      icon: 'users',
    },
    {
      title: 'Schedules',
      href: PATHS.DASHBOARD.SCHEDULES.BASE,
      icon: 'calendar',
      children: [
        {
          title: 'Cleaning Schedule',
          href: PATHS.DASHBOARD.SCHEDULES.CLEANING,
        },
        {
          title: 'Open Talk Schedule',
          href: PATHS.DASHBOARD.SCHEDULES.OPEN_TALK,
        },
        {
          title: 'Holiday Schedule',
          href: PATHS.DASHBOARD.SCHEDULES.HOLIDAY,
        },
      ],
    },
    {
      title: 'Reports',
      href: PATHS.DASHBOARD.REPORTS,
      icon: 'chart',
    },
    {
      title: 'Settings',
      href: PATHS.DASHBOARD.SETTINGS,
      icon: 'settings',
    },
  ],
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
export type NavigationItem = (typeof NAVIGATION.MAIN)[number];
