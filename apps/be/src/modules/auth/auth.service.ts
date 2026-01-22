import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthProfile, AuthTokens, UserAuth } from '@qnoffice/shared';
import { AppConfigService } from '@src/common/shared/services/app-config.service';
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
        role: typeof staff?.role === 'number' ? staff.role : null,
      };

      const newAccessToken = await this.jwtService.signAsync(newPayload, {
        expiresIn: '15m',
      });
      const newRefreshToken = await this.jwtService.signAsync(
        { sub: user.mezonId },
        { expiresIn: '7d', secret: jwtConfig.refreshSecret },
      );

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
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

  async handleOAuthExchange(code: string, state: string): Promise<AuthProfile> {
    const tokenData = await this.exchangeCode(code, state);
    const userInfo = await this.userInfo(tokenData.access_token);

    // Logic that was previously in signIn
    const user = await this.userService.upsertByMezonId(userInfo.user_id, {
      name: userInfo.display_name,
      email: userInfo.email,
      avatar: userInfo.avatar,
    });

    let staff: StaffEntity | null = null;
    try {
      staff = await this.staffService.findByUserId(user.mezonId);

      // If no staff found by userId, try to find by email and link
      if (!staff && user.email) {
        const potentialStaff = await this.staffService.findByEmail(user.email);
        if (potentialStaff && !potentialStaff.userId) {
          Logger.log(
            `Found unlinked staff for user ${user.email}, linking now...`,
          );
          potentialStaff.userId = user.mezonId;
          const savedStaff = await this.staffService.updateStaffUserId(
            potentialStaff.id,
            user.mezonId,
          );
          staff = savedStaff;
        }
      }

      Logger.log(`Staff data found for user ${user.mezonId}:`, staff);
    } catch (error) {
      Logger.warn(
        `No staff data found for user ${user.mezonId}:`,
        error.message,
      );
    }

    const payload: UserAuth = {
      mezonId: user.mezonId,
      name: user?.name || '',
      email: user?.email || '',
      role: typeof staff?.role === 'number' ? staff.role : null,
      staffId: staff?.id,
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
      user: {
        mezonId: user.mezonId,
        name: user?.name || '',
        email: user?.email || '',
        role: typeof staff?.role === 'number' ? staff.role : null,
        staffId: staff?.id,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
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
