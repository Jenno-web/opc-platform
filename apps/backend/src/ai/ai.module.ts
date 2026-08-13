import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { MockAIProvider } from './mock-ai.provider';
import { ClaudeAIProvider } from './claude-ai.provider';
import { AI_PROVIDER } from './ai.constants';
import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [ConfigModule, AuthModule, RealtimeModule],
  controllers: [AiController],
  providers: [
    MockAIProvider,
    ClaudeAIProvider,
    {
      provide: AI_PROVIDER,
      inject: [ConfigService, MockAIProvider, ClaudeAIProvider],
      useFactory: (config: ConfigService, mock: MockAIProvider, claude: ClaudeAIProvider) => {
        const provider = config.get<string>('AI_PROVIDER', 'mock');
        if (provider === 'claude' && !config.get<string>('ANTHROPIC_API_KEY')) {
          // 启动时就校验，而不是等到第一次请求才报 500——配置错误应该在部署阶段就暴露出来
          throw new Error(
            'AI_PROVIDER=claude 但未配置 ANTHROPIC_API_KEY，请在 .env 里补充，或把 AI_PROVIDER 改回 mock',
          );
        }
        return provider === 'claude' ? claude : mock;
      },
    },
    AiService,
  ],
  exports: [AiService],
})
export class AiModule {}
