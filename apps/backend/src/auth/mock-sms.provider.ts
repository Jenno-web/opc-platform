import { Injectable, Logger } from '@nestjs/common';
import type { SmsProvider } from './sms-provider.interface';

/**
 * 开发态默认实现：不接真实短信通道，只把验证码打到服务端日志。
 * AuthService 在使用这个 Provider 时，会把验证码一并放进接口响应的 devCode 字段，
 * 方便在没有真实短信服务商账号的情况下，仍然能在前端完整走通"发验证码 -> 输入验证码 -> 登录"的流程。
 */
@Injectable()
export class MockSmsProvider implements SmsProvider {
  private readonly logger = new Logger(MockSmsProvider.name);

  async sendVerificationCode(phone: string, code: string): Promise<void> {
    this.logger.log(`[Mock 短信] 发送验证码到 ${phone}：${code}（未接入真实短信服务商）`);
  }
}
