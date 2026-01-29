import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type TypeOrmModuleOptions } from '@nestjs/typeorm';
import entities from '@src/common/database/entities';
import { SnakeNamingStrategy } from '@src/common/database/snake-naming.strategy';
import joinUrlPaths from '@src/common/utils/joinUrlPaths';
import { isNil } from 'lodash';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  private get(key: string): string {
    const value = this.configService.get<string>(key);

    if (isNil(value)) {
      throw new Error(key + ' environment variable does not set');
    }

    return value;
  }
  private getNumber(key: string): number {
    const value = this.get(key);

    try {
      return Number(value);
    } catch {
      throw new Error(key + ' environment variable is not a number');
    }
  }

  // private getDuration(key: string, format?: Units): number {
  //   const value = this.getString(key);
  //   const duration = parse(value, format);

  //   if (duration === undefined) {
  //     throw new Error(`${key} environment variable is not a valid duration`);
  //   }

  //   return duration;
  // }

  // private getBoolean(key: string): boolean {
  //   const value = this.get(key);

  //   try {
  //     return Boolean(JSON.parse(value));
  //   } catch {
  //     throw new Error(key + ' env var is not a boolean');
  //   }
  // }

  private getString(key: string): string {
    const value = this.get(key);

    return value.replaceAll('\\n', '\n');
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }
  get nodeEnv(): string {
    return this.getString('NODE_ENV');
  }
  get postgresConfig(): TypeOrmModuleOptions {
    return {
      keepConnectionAlive: !this.isTest,
      type: 'postgres',
      name: 'default',
      host: this.getString('DB_HOST'),
      port: this.getNumber('DB_PORT'),
      username: this.getString('DB_USERNAME'),
      password: this.getString('DB_PASSWORD'),
      database: this.getString('DB_DATABASE'),
      namingStrategy: new SnakeNamingStrategy(),
      subscribers: [],
      synchronize: false,
      entities,
      ssl: this.isProduction
    };
  }

  get postgreSeedConfig(): TypeOrmModuleOptions {
    return {
      keepConnectionAlive: !this.isTest,
      type: 'postgres',
      name: 'server',
      host: this.getString('DB_HOST'),
      port: this.getNumber('DB_PORT'),
      username: this.getString('DB_USERNAME'),
      password: this.getString('DB_PASSWORD'),
      database: this.getString('DB_DATABASE'),
      namingStrategy: new SnakeNamingStrategy(),
      synchronize: false,
      entities,
      ssl: this.isProduction,
    };
  }
  get appConfig() {
    return {
      port: this.getString('PORT'),
    };
  }

  get botConfig(): { botId: string; token: string } {
    return {
      botId: this.getString('MEZON_BOT_ID'),
      token: this.getString('MEZON_BOT_TOKEN'),
    };
  }

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

  get frontendUrl(): string {
    return this.getString('FRONTEND_URL');
  }

  get cookieConfig() {
    return {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'lax' as const,
      path: '/',
    };
  }

  get s3Config() {
    return {
      region: this.getString('AWS_REGION'),
      accessKeyId: this.getString('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.getString('AWS_SECRET_ACCESS_KEY'),
      bucket: this.getString('AWS_S3_BUCKET'),
      endpoint: this.get('AWS_S3_ENDPOINT'),
      publicUrl: this.get('AWS_S3_PUBLIC_URL'),
    };
  }
}
