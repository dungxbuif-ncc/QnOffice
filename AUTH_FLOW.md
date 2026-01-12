# Authentication Code Inventory - QN Office Management

This document provides a comprehensive inventory of all authentication-related code in the QN Office Management System.

## 📁 Backend (NestJS) Authentication Code

### 🔧 Auth Constants

**File:** `/apps/be/src/common/constants/auth.constants.ts`

```typescript
export const AUTH_COOKIES = {
  ACCESS_TOKEN: 'qn_access_token',
  REFRESH_TOKEN: 'qn_refresh_token',
} as const;

export const COOKIE_OPTIONS = {
  ACCESS_TOKEN_EXPIRES: 15 * 60 * 1000, // 15 minutes
  REFRESH_TOKEN_EXPIRES: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;
```

### 🛡️ JWT Strategy

**File:** `/apps/be/src/modules/auth/strategies/jwt.strategy.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AUTH_COOKIES } from '@src/common/constants/auth.constants';
import { AppConfigService } from '@src/common/shared/services/app-config.service';
import { AccessTokenPayload } from '@src/common/types';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(appConfigService: AppConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const token = request?.cookies?.[AUTH_COOKIES.ACCESS_TOKEN];
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: appConfigService.jwtConfig.secret,
    });
  }

  async validate(payload: AccessTokenPayload) {
    return payload;
  }
}
```

### 🔐 JWT Auth Guard

**File:** `/apps/be/src/modules/auth/guards/jwt-auth.guard.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

### 👮 Role Guard

**File:** `/apps/be/src/common/gaurds/role.gaurd.ts`

```typescript
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@src/common/constants/user.constants';

export const ROLES_KEY = 'roles';
export const Roles = (roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) throw new UnauthorizedException('User not authenticated');

    const hasRole = requiredRoles.some((role) => user.role === role);
    if (!hasRole)
      throw new ForbiddenException(
        `User does not have required roles: ${requiredRoles.join(', ')}`,
      );

    return true;
  }
}
```

### 🏗️ Auth Module

**File:** `/apps/be/src/modules/auth/auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppConfigService } from '@src/common/shared/services/app-config.service';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (appConfigService: AppConfigService) => ({
        secret: appConfigService.jwtConfig.secret,
        signOptions: { expiresIn: '15m' },
      }),
      inject: [AppConfigService],
    }),
    UserModule,
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
```

### 🎮 Auth Controller

**File:** `/apps/be/src/modules/auth/auth.controller.ts`

- **Endpoints:**
  - `GET /auth/login` - OAuth redirect
  - `POST /auth/exchange` - Token exchange
  - `POST /auth/refresh` - Token refresh
  - `GET /auth/profile` - User profile (protected)
  - `POST /auth/logout` - Logout (protected)

### ⚙️ Auth Service

**File:** `/apps/be/src/modules/auth/auth.service.ts`

- **Methods:**
  - `exchangeCode()` - Exchange OAuth code for tokens
  - `signIn()` - Create JWT tokens for user
  - `refreshToken()` - Refresh expired tokens
  - `userInfo()` - Get user info from OAuth provider
  - `getOauthUrl()` - Generate OAuth URL
  - `handleOAuthExchange()` - Complete OAuth flow
  - `handleRefreshToken()` - Handle token refresh

### ⚙️ Configuration (AppConfigService)

**File:** `/apps/be/src/common/shared/services/app-config.service.ts`

```typescript
get jwtConfig() {
  return {
    secret: this.getString('JWT_SECRET'),
    refreshSecret: this.getString('JWT_REFRESH_SECRET'),
  };
}

get oauthConfig() {
  return {
    baseUri: this.getString('OAUTH_URL'),
    clientId: this.getString('CLIENT_ID'),
    clientSecret: this.getString('CLIENT_SECRET'),
    redirectUri: joinUrlPaths(this.frontendUrl, 'auth/callback'),
  };
}

get cookieConfig() {
  return {
    httpOnly: true,
    secure: this.isProduction,
    sameSite: 'lax' as const,
    path: '/',
  };
}
```

### 🛡️ Usage Example (Protected Route)

```typescript
@Controller('branches')
export class BranchController {
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.HR, UserRole.GDVP])
  findAll(@Query() queries: AppPaginateOptionsDto) {
    return this.branchService.findAll(queries);
  }
}
```

## 📱 Frontend (NextJS) Authentication Code

### 🎯 Auth Context

**File:** `/apps/web/src/contexts/auth-context.tsx`

- **Hooks:** `useAuth()`
- **Methods:** `login()`, `logout()`, `refetch()`
- **State:** `user`, `isLoading`, `isAuthenticated`
- **Auto-redirect logic for protected/public pages**

### 📞 Auth API Service

**File:** `/apps/web/src/lib/auth-api-simple.ts`

```typescript
export const authApi = {
  getProfile: async (): Promise<{ data: User }> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  getLoginUrl: (): string => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    return `${apiUrl}/auth/login`;
  },
};
```

### 🏠 Login Page

**File:** `/apps/web/src/app/login/page.tsx`

- OAuth login button that redirects to backend `/auth/login`
- Auto-redirect if user already authenticated

### 🔄 OAuth Callback Page

**File:** `/apps/web/src/app/auth/callback/page.tsx`

- Processes OAuth callback with code/state parameters
- Calls backend `/auth/exchange` endpoint
- Handles success/error states
- Redirects to dashboard on success

### ❌ Auth Error Page

**File:** `/apps/web/src/app/auth/error/page.tsx`

- Displays OAuth authentication errors

## 🔧 Configuration & Environment

### Backend Environment Variables (.env)

```bash
# OAuth Configuration
OAUTH_URL=https://mezon.ai
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret
FRONTEND_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

### Frontend Environment Variables (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## 🔐 Security Features Implemented

1. **HTTP-Only Cookies** - Tokens stored securely, not accessible via JavaScript
2. **JWT Strategy** - Passport.js integration with cookie extraction
3. **Role-Based Access Control** - Guards for different user roles
4. **Token Refresh** - Automatic token renewal flow
5. **OAuth 2.0 Flow** - Mezon OAuth integration
6. **CORS Protection** - Secure cookie configuration
7. **Auth Guards** - Route protection at controller level

## 📋 Missing/TODO Authentication Code (Based on BFF Architecture)

### ❌ NextJS Middleware (Not Implemented)

**File:** `/apps/web/middleware.ts`

```typescript
// TODO: Implement NextJS middleware for route protection
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';

export async function middleware(request: NextRequest) {
  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const session = await getIronSession(request, response, sessionConfig);
    if (!session.accessToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  return NextResponse.next();
}
```

### ❌ Iron Session Configuration (Not Implemented)

**File:** `/apps/web/lib/session.ts`

```typescript
// TODO: Implement iron-session for BFF pattern
import { SessionOptions } from 'iron-session';

export interface AuthProfile {
  accessToken?: string;
  refreshToken?: string;
  user?: { id: number; email: string; name: string };
}

export const sessionConfig: SessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD!,
  cookieName: 'qn-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};
```

### ❌ API Proxy Routes (Not Implemented)

**File:** `/apps/web/app/api/[...proxy]/route.ts`

```typescript
// TODO: Implement BFF API proxy pattern
import { getIronSession } from 'iron-session';

export async function GET(request: NextRequest) {
  const session = await getIronSession(request, response, sessionConfig);

  // Forward to NestJS with Bearer token
  const response = await fetch(
    `${BACKEND_URL}${request.url.replace('/api', '')}`,
    {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  );

  // Handle token refresh on 401
  if (response.status === 401) {
    // Refresh logic...
  }

  return response;
}
```

## 🚀 Current Authentication Architecture

**Current State:** Direct Frontend ↔ Backend communication

- Frontend calls backend APIs directly
- Cookies managed by backend
- Auth context handles user state

**Target State (BFF):** Frontend ↔ NextJS ↔ Backend

- NextJS acts as BFF proxy
- Iron-session manages client cookies
- Bearer tokens for backend auth
- Middleware route protection

## Overview

This document describes the Backend-For-Frontend (BFF) authentication flow implemented in the QN Office Management System, where NextJS acts as a proxy server that forwards all API requests to the NestJS backend using Bearer tokens, while managing client sessions with iron-session cookies.

## Architecture

```
┌─────────┐    ┌─────────────────┐    ┌─────────────┐
│ Browser │    │ NextJS (BFF)    │    │ NestJS (BE) │
│         │    │ - iron-session  │    │ - Bearer    │
│         │    │ - Proxy APIs    │    │   tokens    │
└─────────┘    └─────────────────┘    └─────────────┘
```

## Flow Diagram

```
┌─────────┐         ┌──────────────┐         ┌─────────┐         ┌──────────┐
│ Browser │         │ NextJS (BFF) │         │ NestJS  │         │  Mezon   │
└────┬────┘         └──────┬───────┘         └────┬────┘         └────┬─────┘
     │                     │                      │                    │
     │ 1. Click Login      │                      │                    │
     ├────────────────────>│                      │                    │
     │                     │                      │                    │
     │                     │ 2. GET /api/auth/url │                    │
     │                     ├─────────────────────>│                    │
     │                     │<─────────────────────┤                    │
     │                     │                      │                    │
     │ 3. Redirect to Mezon OAuth                 │                    │
     ├────────────────────────────────────────────┼───────────────────>│
     │                     │                      │                    │
     │                     │                      │  4. User Login     │
     │                     │                      │    & Authorize     │
     │                     │                      │                    │
     │ 5. Callback /auth/callback?code=xxx&state=yyy                   │
     │<───────────────────────────────────────────┼────────────────────┤
     │                     │                      │                    │
     │ 6. NextJS processes │                      │                    │
     │    callback         │ 7. POST /auth/exchange {code}             │
     │                     ├─────────────────────>│                    │
     │                     │                      │                    │
     │                     │                      │ 8. Exchange & get  │
     │                     │                      │    Bearer token    │
     │                     │                      ├───────────────────>│
     │                     │                      │<───────────────────┤
     │                     │                      │                    │
     │                     │ 9. {access_token,    │                    │
     │                     │     refresh_token,   │                    │
     │                     │     user}            │                    │
     │                     │<─────────────────────┤                    │
     │                     │                      │                    │
     │                     │ 10. Store tokens in  │                    │
     │                     │     iron-session     │                    │
     │                     │                      │                    │
     │ 11. Set encrypted   │                      │                    │
     │     session cookie  │                      │                    │
     │<────────────────────┤                      │                    │
     │                     │                      │                    │
     │ 12. Redirect to /dashboard                 │                    │
     │                     │                      │                    │
```

## Detailed Steps

### 1. User Initiates Login

- User clicks "Login with Mezon" button on `/login` page
- Browser calls NextJS route `GET /api/auth/login`
- NextJS forwards request to NestJS `GET /auth/login`
- NestJS returns OAuth URL
- NextJS redirects browser to Mezon OAuth authorization page

### 2. OAuth Callback Processing

- Mezon redirects to NextJS `/auth/callback?code=xxx&state=yyy`
- NextJS API route `/api/auth/callback` processes the callback:
  1. Extracts code and state parameters
  2. Calls NestJS `POST /auth/exchange` with Bearer token support
  3. NestJS exchanges code for OAuth tokens and returns JWT tokens + user info
  4. NextJS stores tokens in iron-session encrypted cookie
  5. Redirects to `/dashboard`

### 3. Protected API Calls

```
┌─────────┐         ┌──────────────┐         ┌─────────┐
│ Browser │         │ NextJS (BFF) │         │ NestJS  │
└────┬────┘         └──────┬───────┘         └────┬────┘
     │                     │                      │
     │ 1. API Request      │                      │
     │    /api/branches    │                      │
     ├────────────────────>│                      │
     │                     │                      │
     │                     │ 2. Extract session   │
     │                     │    & get Bearer token│
     │                     │                      │
     │                     │ 3. Forward request   │
     │                     │    with Bearer header│
     │                     ├─────────────────────>│
     │                     │                      │
     │                     │ 4. Process request   │
     │                     │    & return data     │
     │                     │<─────────────────────┤
     │                     │                      │
     │ 5. Return response  │                      │
     │<────────────────────┤                      │
```

### 4. Token Refresh Flow

```
┌─────────┐         ┌──────────────┐         ┌─────────┐
│ Browser │         │ NextJS (BFF) │         │ NestJS  │
└────┬────┘         └──────┬───────┘         └────┬────┘
     │                     │                      │
     │ 1. API Request      │                      │
     ├────────────────────>│                      │
     │                     │                      │
     │                     │ 2. Forward with      │
     │                     │    expired token     │
     │                     ├─────────────────────>│
     │                     │                      │
     │                     │ 3. 401 Unauthorized  │
     │                     │<─────────────────────┤
     │                     │                      │
     │                     │ 4. Use refresh_token │
     │                     │    to get new tokens │
     │                     ├─────────────────────>│
     │                     │<─────────────────────┤
     │                     │                      │
     │                     │ 5. Update session    │
     │                     │    with new tokens   │
     │                     │                      │
     │                     │ 6. Retry original    │
     │                     │    request           │
     │                     ├─────────────────────>│
     │                     │<─────────────────────┤
     │                     │                      │
     │ 7. Success response │                      │
     │<────────────────────┤                      │
```

## Implementation Details

### NextJS BFF Middleware

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const session = await getIronSession(request, response, sessionConfig);

    if (!session.accessToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}
```

### API Route Proxy Pattern

```typescript
// pages/api/[...proxy].ts or app/api/[...proxy]/route.ts
import { getIronSession } from 'iron-session';

export async function handler(req: NextRequest) {
  const session = await getIronSession(req, res, sessionConfig);

  // Forward to NestJS with Bearer token
  const response = await fetch(`${BACKEND_URL}${req.url.replace('/api', '')}`, {
    method: req.method,
    headers: {
      ...req.headers,
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: req.body,
  });

  // Handle token refresh on 401
  if (response.status === 401) {
    const newTokens = await refreshTokens(session.refreshToken);
    session.accessToken = newTokens.accessToken;
    session.refreshToken = newTokens.refreshToken;
    await session.save();

    // Retry request with new token
    const retryResponse = await fetch(
      `${BACKEND_URL}${req.url.replace('/api', '')}`,
      {
        method: req.method,
        headers: {
          ...req.headers,
          Authorization: `Bearer ${newTokens.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: req.body,
      },
    );

    return retryResponse;
  }

  return response;
}
```

### Iron Session Configuration

```typescript
// lib/session.ts
import { SessionOptions } from 'iron-session';

export interface AuthProfile {
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: number;
    email: string;
    name: string;
  };
}

export const sessionConfig: SessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD!,
  cookieName: 'qn-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};
```

## Security Features

1. **Iron Session Encryption**: Session data encrypted with AES-256-GCM
2. **HTTP-Only Cookies**: Session cookies not accessible via JavaScript
3. **Secure Proxy**: All backend communication happens server-side
4. **Bearer Token Security**: NestJS validates JWT tokens securely
5. **Route Protection**: NextJS middleware protects dashboard routes
6. **Token Refresh**: Automatic token refresh on 401 responses
7. **CORS Isolation**: Frontend never directly calls backend APIs

## Environment Variables

### NextJS (.env.local)

```
BACKEND_URL=http://localhost:4000
SECRET_COOKIE_PASSWORD=your-32-character-secret-key
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

### NestJS (.env)

```
OAUTH_URL=https://mezon.ai
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

## API Endpoints

### NextJS BFF

- `GET /api/auth/login` - Initiates OAuth flow
- `GET /auth/callback` - OAuth callback handler
- `POST /api/auth/logout` - Clears session
- `GET /api/auth/profile` - Returns current user
- `GET /api/branches` - Proxies to NestJS with Bearer token
- `POST /api/branches` - Proxies to NestJS with Bearer token
- `GET /api/*` - Generic proxy for all backend APIs

### NestJS Backend

- `GET /auth/login` - Returns OAuth URL
- `POST /auth/exchange` - Exchanges code for JWT tokens
- `POST /auth/refresh` - Refreshes JWT tokens
- `GET /auth/profile` - Returns user profile (Bearer auth)
- `GET /branches` - Branch management (Bearer auth)
- All other business logic endpoints (Bearer auth)

## Benefits of This Architecture

1. **Security**: No direct frontend-to-backend communication
2. **Simplified Auth**: Frontend only manages session cookies
3. **Token Management**: Server-side token refresh handling
4. **Route Protection**: Built-in NextJS middleware protection
5. **Type Safety**: Full-stack TypeScript with tRPC-like experience
6. **Performance**: Server-side request optimization
7. **Monitoring**: Centralized API logging and metrics
