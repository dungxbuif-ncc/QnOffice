# Path Constants Documentation

This directory contains centralized path definitions for the entire frontend application.

## Overview

The `PATHS` constant provides a type-safe, centralized way to manage all application routes and API endpoints. This approach:

- **Prevents typos** in route definitions
- **Makes refactoring easier** when routes change
- **Provides better IntelliSense** support
- **Ensures consistency** across the application

## Usage

### Basic Usage

```typescript
import { PATHS } from '@/constants/paths';

// Navigate to dashboard
router.push(PATHS.DASHBOARD.BASE);

// Navigate to specific page
router.push(PATHS.DASHBOARD.BRANCHES);

// API calls
const response = await fetch(PATHS.API.AUTH.ME);
```

### In Components

```typescript
import { PATHS } from '@/constants/paths';

function Navigation() {
  return (
    <nav>
      <Link href={PATHS.DASHBOARD.BASE}>Dashboard</Link>
      <Link href={PATHS.DASHBOARD.STAFF}>Staff</Link>
      <Link href={PATHS.DASHBOARD.BRANCHES}>Branches</Link>
    </nav>
  );
}
```

### In Services

```typescript
import { PATHS } from '@/constants/paths';
import { BaseService } from './base-service';

export class AuthService extends BaseService {
  async me() {
    return this.get(PATHS.API.AUTH.ME);
  }

  async logout() {
    await this.post(PATHS.API.AUTH.LOGOUT);
    window.location.href = PATHS.AUTH.LOGIN;
  }
}
```

### With Navigation Data

```typescript
import { NAVIGATION } from '@/constants/paths';

function Sidebar() {
  return (
    <ul>
      {NAVIGATION.MAIN.map((item) => (
        <li key={item.title}>
          <Link href={item.href}>{item.title}</Link>
        </li>
      ))}
    </ul>
  );
}
```

## Utilities

### Path Checking Utilities

```typescript
import { PathUtils } from '@/constants/paths';

// Check if path is public (no auth needed)
if (PathUtils.isPublicPath('/auth/login')) {
  // Allow access
}

// Check if path is protected (auth required)
if (PathUtils.isProtectedPath('/dashboard')) {
  // Check authentication
}

// Check if path is static asset
if (PathUtils.isStaticAsset('/favicon.ico')) {
  // Skip processing
}

// Get default redirect paths
const dashboardPath = PathUtils.getDefaultAuthenticatedPath();
const loginPath = PathUtils.getDefaultUnauthenticatedPath();
```

## Structure

```typescript
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
    BASE: '/api',
    AUTH: {
      BASE: '/api/auth',
      ME: '/api/auth/me',
      LOGOUT: '/api/auth/logout',
      OAUTH_URL: '/auth/oauth/url',
    },
    BRANCHES: '/branches',
    // ... more API endpoints
  },
} as const;
```

## Best Practices

1. **Always use PATHS constants** instead of hardcoded strings
2. **Import from the constants directory** for consistency
3. **Use PathUtils** for conditional logic based on routes
4. **Update this file** when adding new routes
5. **Keep the structure logical** and hierarchical

## Adding New Paths

When adding new routes:

1. Add the path to the appropriate section in `PATHS`
2. Update `NAVIGATION` if it's a menu item
3. Update `PUBLIC_PATHS` or `PROTECTED_PATHS` as needed
4. Update middleware configuration if route protection is required

## Migration

When migrating from hardcoded paths:

1. Find all hardcoded path strings in your component/service
2. Replace with appropriate `PATHS` constant
3. Add import statement for `PATHS`
4. Test the functionality to ensure paths work correctly

## Type Safety

All paths are typed using TypeScript's `as const` assertion, providing:

- **Autocomplete** in your IDE
- **Compile-time checking** for typos
- **Refactoring support** when paths change
