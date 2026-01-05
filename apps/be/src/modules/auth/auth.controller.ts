import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('oauth/url')
  async getOAuthUrl() {
    const oauthUrl = this.authService.getOauthUrl();
    return { url: oauthUrl };
  }

  @Post('exchange')
  async exchange(
    @Body() body: { code: string; state: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const { user, tokens } = await this.authService.handleOAuthExchange(
        body.code,
        body.state,
      );
      return {
        user: {
          id: user.mezonId,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        tokens,
      };
    } catch (error) {
      res.status(401);
      return { success: false, message: error.message };
    }
  }

  @Post('refresh')
  async refresh(
    @Body() body: { refresh_token: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const tokens = await this.authService.handleRefreshToken(
        body.refresh_token,
      );

      return {
        tokens,
      };
    } catch (error) {
      res.status(401);
      return { success: false, message: error.message };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout() {
    return { message: 'Logged out successfully' };
  }
}
