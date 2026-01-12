/**
 * API Path Constants
 * Auto-generated from backend controllers
 */

export const API_PATHS = {
  // Auth
  AUTH: {
    BASE: '/auth',
    OAUTH_URL: '/auth/oauth/url',
    EXCHANGE: '/auth/exchange',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
    LOGOUT: '/auth/logout',
  },

  // Upload
  UPLOAD: {
    BASE: '/upload',
    PRESIGNED_URL: '/upload/presigned-url',
    PRESIGNED_URLS: '/upload/presigned-urls',
    PRESIGNED_URLS_OPENTALK: '/upload/presigned-urls/opentalk',
  },

  // Pantry Menu
  PANTRY_MENU: '/pantry-menu',

  // Penalty Types
  PENALTY_TYPES: {
    BASE: '/penalty-types',
    CREATE: '/penalty-types',
    LIST: '/penalty-types',
    BY_ID: (id: number | string) => `/penalty-types/${id}`,
    UPDATE: (id: number | string) => `/penalty-types/${id}`,
    DELETE: (id: number | string) => `/penalty-types/${id}`,
  },

  // Penalties
  PENALTIES: {
    BASE: '/penalties',
    CREATE: '/penalties',
    LIST: '/penalties',
    BY_ID: (id: number | string) => `/penalties/${id}`,
    UPDATE: (id: number | string) => `/penalties/${id}`,
    UPDATE_EVIDENCE: (id: number | string) => `/penalties/${id}/evidence`,
    DELETE: (id: number | string) => `/penalties/${id}`,
  },

  // Cleaning
  CLEANING: {
    BASE: '/cleaning',
    // Cycles
    CREATE_CYCLE: '/cleaning/cycles',
    LIST_CYCLES: '/cleaning/cycles',
    GET_CYCLE: (id: number | string) => `/cleaning/cycles/${id}`,
    UPDATE_CYCLE: (id: number | string) => `/cleaning/cycles/${id}`,
    DELETE_CYCLE: (id: number | string) => `/cleaning/cycles/${id}`,
    // Events
    CREATE_EVENT: '/cleaning/events',
    LIST_EVENTS: '/cleaning/events',
    GET_EVENTS_BY_CYCLE: (cycleId: number | string) =>
      `/cleaning/cycles/${cycleId}/events`,
    GET_EVENT: (id: number | string) => `/cleaning/events/${id}`,
    UPDATE_EVENT: (id: number | string) => `/cleaning/events/${id}`,
    DELETE_EVENT: (id: number | string) => `/cleaning/events/${id}`,
    // Operations
    SWAP_PARTICIPANTS: '/cleaning/events/swap',
    SPREADSHEET: '/cleaning/spreadsheet',
    BULK_ASSIGN: '/cleaning/bulk-assign',
    CONFLICTS: '/cleaning/conflicts',
  },

  // Opentalk
  OPENTALK: {
    BASE: '/opentalk',
    // Cycles
    CREATE_CYCLE: '/opentalk/cycles',
    LIST_CYCLES: '/opentalk/cycles',
    GET_CYCLE: (id: number | string) => `/opentalk/cycles/${id}`,
    UPDATE_CYCLE: (id: number | string) => `/opentalk/cycles/${id}`,
    DELETE_CYCLE: (id: number | string) => `/opentalk/cycles/${id}`,
    // Events
    CREATE_EVENT: '/opentalk/events',
    LIST_EVENTS: '/opentalk/events',
    GET_EVENTS_BY_CYCLE: (cycleId: number | string) =>
      `/opentalk/cycles/${cycleId}/events`,
    GET_EVENT: (id: number | string) => `/opentalk/events/${id}`,
    UPDATE_EVENT: (id: number | string) => `/opentalk/events/${id}`,
    DELETE_EVENT: (id: number | string) => `/opentalk/events/${id}`,
    // Operations
    SWAP: '/opentalk/swap',
    SPREADSHEET: '/opentalk/spreadsheet',
    BULK_ASSIGN: '/opentalk/bulk-assign',
    CONFLICTS: '/opentalk/conflicts',
    // Swap Requests
    LIST_SWAP_REQUESTS: '/opentalk/swap-requests',
    CREATE_SWAP_REQUEST: '/opentalk/swap-requests',
    REVIEW_SWAP_REQUEST: (id: number | string) =>
      `/opentalk/swap-requests/${id}/review`,
    // Slides
    SUBMIT_SLIDE: '/opentalk/slides/submit',
    GET_SLIDE: (eventId: number | string) => `/opentalk/slides/${eventId}`,
  },

  // Schedules (Generic)
  SCHEDULES: {
    BASE: '/schedules',
    // Cycles
    CREATE_CYCLE: '/schedules/cycles',
    LIST_CYCLES: '/schedules/cycles',
    GET_CYCLE: (id: number | string) => `/schedules/cycles/${id}`,
    // Events
    CREATE_EVENT: '/schedules/events',
    LIST_EVENTS: '/schedules/events',
    GET_EVENTS_BY_CYCLE: (cycleId: number | string) =>
      `/schedules/cycles/${cycleId}/events`,
    GET_EVENT: (id: number | string) => `/schedules/events/${id}`,
    UPDATE_EVENT: (id: number | string) => `/schedules/events/${id}`,
    DELETE_EVENT: (id: number | string) => `/schedules/events/${id}`,
    // Operations
    SWAP_EVENTS: (event1Id: number | string, event2Id: number | string) =>
      `/schedules/events/${event1Id}/swap/${event2Id}`,
  },

  // Staff
  STAFF: {
    BASE: '/staffs',
    LIST: '/staffs',
    ACTIVE: '/staffs/active',
    BY_USER: (userId: number | string) => `/staffs/by-user/${userId}`,
    BY_ID: (id: number | string) => `/staffs/${id}`,
    CREATE: '/staffs',
    UPDATE_MEZON_ID: (id: number | string) => `/staffs/${id}/mezon-id`,
  },

  // Branches
  BRANCHES: {
    BASE: '/branches',
    LIST: '/branches',
    BY_ID: (id: number | string) => `/branches/${id}`,
    CREATE: '/branches',
    UPDATE: (id: number | string) => `/branches/${id}`,
    DELETE: (id: number | string) => `/branches/${id}`,
  },

  // Calendar
  CALENDAR: {
    BASE: '/calendar',
    EVENTS: '/calendar/events',
  },
} as const;

export type ApiPaths = typeof API_PATHS;
