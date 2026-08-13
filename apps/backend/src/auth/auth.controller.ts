import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';
import { AuthService } from './auth.service';

class PhoneDto {
  @IsString()
  @Matches(/^1\d{10}$/, { message: '请输入 11 位手机号' })
  phone: string;
}

class VerifyCodeDto extends PhoneDto {
  @IsString()
  @Length(6, 6, { message: '验证码为 6 位数字' })
  code: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('dev-login')
  @ApiOperation({ summary: '[演示用] mock 登录：按手机号直接签发 JWT，跳过验证码' })
  @ApiOkResponse({ description: '返回 JWT token 与 userId' })
  devLogin(@Body() dto: PhoneDto) {
    return this.authService.devLogin(dto.phone);
  }

  @Post('send-code')
  @ApiOperation({ summary: '发送短信验证码；未接入真实短信服务商时，响应里的 devCode 字段会带回验证码方便联调' })
  sendCode(@Body() dto: PhoneDto) {
    return this.authService.sendVerificationCode(dto.phone);
  }

  @Post('verify-code')
  @ApiOperation({ summary: '校验验证码并登录（真正的手机号登录入口）' })
  verifyCode(@Body() dto: VerifyCodeDto) {
    return this.authService.verifyCode(dto.phone, dto.code);
  }
}
