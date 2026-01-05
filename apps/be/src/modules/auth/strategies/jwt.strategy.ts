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
