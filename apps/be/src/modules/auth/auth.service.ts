import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '@src/common/shared/services/app-config.service';
import { AccessTokenPayload } from '@src/common/types';
import StaffEntity from '@src/modules/staff/staff.entity';
import { StaffService } from '@src/modules/staff/staff.service';
import UserEntity from '@src/modules/user/user.entity';
import { UserService } from '../user/user.service';

export interface ExchangeCodeData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface UserInfoData {
  avatar: string;
  display_name: string;
  email: string;
  user_id: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private appConfigService: AppConfigService,
    private userService: UserService,
    private staffService: StaffService,
  ) {}

  async exchangeCode(code: string, state: string): Promise<ExchangeCodeData> {
    const oauthConfig = this.appConfigService.oauthConfig;
    const res = await fetch(`${oauthConfig.baseUri}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        state,
        client_id: oauthConfig.clientId,
        client_secret: oauthConfig.clientSecret,
        redirect_uri: oauthConfig.redirectUri,
        scope: 'openid offline',
      }),
    });

    if (!res.ok) {
      throw new BadRequestException('Failed to exchange code for token');
    }

    const data: ExchangeCodeData = await res.json();
    return data;
  }

  async signIn(
    mezonId: string,
    meta?: {
      name?: string;
      email?: string;
      avatar?: string;
    },
  ): Promise<{ user: UserEntity; staff?: any; tokens: AuthTokens }> {
    const user = await this.userService.upsertByMezonId(mezonId, meta);
    let staff: any = null;
    try {
      staff = await this.staffService.findByUserId(user.mezonId);
      Logger.log(`Staff data found for user ${user.mezonId}:`, staff);
    } catch (error) {
      Logger.warn(
        `No staff data found for user ${user.mezonId}:`,
        error.message,
      );
    }

    const payload: AccessTokenPayload = {
      mezonId: user.mezonId,
      role: staff?.role || null,
    };

    const jwtConfig = this.appConfigService.jwtConfig;
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '30d',
    });
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.mezonId },
      { expiresIn: '30d', secret: jwtConfig.refreshSecret },
    );

    return {
      user,
      staff,
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const jwtConfig = this.appConfigService.jwtConfig;
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: jwtConfig.refreshSecret,
      });

      const user = await this.userService.findById(payload.sub);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      const staff = await this.staffService.findByUserId(user.mezonId);

      const newPayload = {
        sub: user.mezonId,
        mezonId: user.mezonId,
        role: staff?.role || null,
      };

      const newAccessToken = await this.jwtService.signAsync(newPayload, {
        expiresIn: '15m',
      });
      const newRefreshToken = await this.jwtService.signAsync(
        { sub: user.mezonId },
        { expiresIn: '7d', secret: jwtConfig.refreshSecret },
      );

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      };
    } catch (error) {
      throw new BadRequestException('Invalid refresh token');
    }
  }

  async userInfo(accessToken: string): Promise<UserInfoData> {
    const oauthConfig = this.appConfigService.oauthConfig;
    const userRes = await fetch(`${oauthConfig.baseUri}/userinfo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        access_token: encodeURIComponent(accessToken),
        client_id: oauthConfig.clientId,
        client_secret: oauthConfig.clientSecret,
        redirect_uri: oauthConfig.redirectUri,
      }),
    });

    if (!userRes.ok) {
      throw new BadRequestException('Failed to fetch user info');
    }

    const data: UserInfoData = await userRes.json();
    return data;
  }

  getOauthUrl(): string {
    const oauthConfig = this.appConfigService.oauthConfig;
    const params = new URLSearchParams({
      client_id: oauthConfig.clientId,
      redirect_uri: oauthConfig.redirectUri,
      response_type: 'code',
      scope: 'openid offline',
      state: crypto.randomUUID().substring(0, 10),
    });

    return `${oauthConfig.baseUri}/oauth2/auth?${params.toString()}`;
  }

  async handleOAuthExchange(
    code: string,
    state: string,
  ): Promise<{ user: UserEntity; tokens: AuthTokens; staff?: StaffEntity }> {
    const tokenData = await this.exchangeCode(code, state);
    const userInfo = await this.userInfo(tokenData.access_token);
    return this.signIn(userInfo.user_id, {
      name: userInfo.display_name,
      email: userInfo.email,
      avatar: userInfo.avatar,
    });
  }

  async handleRefreshToken(refreshToken: string): Promise<AuthTokens> {
    if (!refreshToken) {
      throw new BadRequestException('No refresh token provided');
    }

    try {
      return await this.refreshToken(refreshToken);
    } catch (error) {
      throw new BadRequestException('Invalid refresh token');
    }
  }

  async validateUser(userId: string): Promise<UserEntity | null> {
    return this.userService.findById(userId);
  }
}
