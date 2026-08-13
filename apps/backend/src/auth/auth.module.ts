import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { MockSmsProvider } from './mock-sms.provider';
import { SMS_PROVIDER } from './sms.constants';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'dev-secret-change-me'),
        signOptions: { expiresIn: '30d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    MockSmsProvider,
    // 目前只有 MockSmsProvider 一个实现；接入阿里云/腾讯云短信后，
    // 在这里根据 SMS_PROVIDER 环境变量切换到真实 Provider，写法和 AiModule 里切换 AI_PROVIDER 完全一样。
    { provide: SMS_PROVIDER, useExisting: MockSmsProvider },
  ],
  exports: [JwtModule, JwtAuthGuard],
})
export class AuthModule {}
