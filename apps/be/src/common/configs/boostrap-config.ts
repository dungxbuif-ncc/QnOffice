import {
  BadRequestException,
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HttpExceptionFilter } from '@src/common/filters/http-exception.filter';
import { TransformInterceptor } from '@src/common/interceptors/transform.interceptor';
import loggingMiddleware from '@src/common/middlewares/logger.middleware';
import { AppConfigService } from '@src/common/shared/services/app-config.service';
import { SharedModule } from '@src/common/shared/shared.module';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import * as httpContext from 'express-http-context';
import helmet from 'helmet';
import morgan from 'morgan';
import { swaggerConfig } from './swagger.config';

export default async function bootstrapConfig(app: INestApplication) {
  const configService = app.select(SharedModule).get(AppConfigService);

  app.use(cookieParser());
  app.enableCors({
    origin: configService.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
  });

  app.use(httpContext.middleware);
  app.use(loggingMiddleware);
  app.use(helmet());
  app.use(compression());
  app.use(morgan('combined'));
  app.enableVersioning();
  await swaggerConfig(app);
  const reflector = app.get(Reflector);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: true,
      exceptionFactory: (validationErrors = []) => {
        const errors = validationErrors.map((error) => ({
          property: error.property,
          constraints: error.constraints,
        }));
        return new BadRequestException(errors);
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector),
    new TransformInterceptor(),
  );
}
