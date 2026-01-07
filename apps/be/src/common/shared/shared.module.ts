import { Global, Module, type Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppConfigService } from './services/app-config.service';
import { GeneratorService } from './services/generator.service';
import { S3Service } from './services/s3.service';
import { TokenService } from './services/token.service';
import { ValidatorService } from './services/validator.service';

const providers: Provider[] = [
  AppConfigService,
  ValidatorService,
  GeneratorService,
  TokenService,
  S3Service,
];

@Global()
@Module({
  providers,
  imports: [
    JwtModule.register({}),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  exports: [...providers],
})
export class SharedModule {}
