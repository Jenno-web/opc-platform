import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthPayload } from '../common/jwt-auth.guard';

class UpdateAvatarDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(3_000_000, { message: '图片太大，请换一张更小的图片' })
  @Matches(/^data:image\//, { message: 'avatarUrl 必须是 data:image/ 开头的图片数据' })
  avatarUrl: string;
}

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: '获取当前登录用户资料（对应"我的"页头部与统计）' })
  getMe(@CurrentUser() user: AuthPayload) {
    return this.usersService.getProfile(user.sub);
  }

  @Patch('me/avatar')
  @ApiOperation({ summary: '更新当前用户头像（前端压缩成 base64 后传入）' })
  updateAvatar(@CurrentUser() user: AuthPayload, @Body() dto: UpdateAvatarDto) {
    return this.usersService.updateAvatar(user.sub, dto.avatarUrl);
  }
}
