import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SMS_PROVIDER } from './sms.constants';
import type { SmsProvider } from './sms-provider.interface';
import { MockSmsProvider } from './mock-sms.provider';

const CODE_TTL_MS = 5 * 60 * 1000;
const CODE_LENGTH = 6;

interface PendingCode {
  code: string;
  expiresAt: number;
}

@Injectable()
export class AuthService {
  // Demo 阶段用内存存验证码即可；多实例部署时应该换成 Redis。
  private readonly pendingCodes = new Map<string, PendingCode>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    @Inject(SMS_PROVIDER) private readonly smsProvider: SmsProvider,
  ) {}

  private async issueToken(phone: string) {
    const user = await this.prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone, nickname: `用户${phone.slice(-4)}` },
    });
    const token = await this.jwtService.signAsync({ sub: user.id, phone: user.phone });
    return { token, userId: user.id };
  }

  /**
   * MVP 阶段的 mock 登录：跳过验证码，按手机号直接签发 JWT。
   * 前端首次请求时用它自动完成"静默登录"，保留下来是为了演示时不用每次都走一遍短信流程。
   * 真正的短信验证码登录见 sendVerificationCode / verifyCode。
   */
  async devLogin(phone: string) {
    return this.issueToken(phone);
  }

  async sendVerificationCode(phone: string) {
    const code = Math.floor(Math.random() * 10 ** CODE_LENGTH)
      .toString()
      .padStart(CODE_LENGTH, '0');

    this.pendingCodes.set(phone, { code, expiresAt: Date.now() + CODE_TTL_MS });
    await this.smsProvider.sendVerificationCode(phone, code);

    const isMock = this.smsProvider instanceof MockSmsProvider;
    return {
      sent: true,
      expiresInSeconds: CODE_TTL_MS / 1000,
      // 只有在没接真实短信服务商时才把验证码带回前端，方便演示；接了真实服务商这个字段不会出现
      devCode: isMock ? code : undefined,
    };
  }

  async verifyCode(phone: string, code: string) {
    const pending = this.pendingCodes.get(phone);
    if (!pending || pending.expiresAt < Date.now()) {
      throw new BadRequestException('验证码已过期，请重新获取');
    }
    if (pending.code !== code) {
      throw new BadRequestException('验证码错误');
    }

    this.pendingCodes.delete(phone);
    return this.issueToken(phone);
  }
}
