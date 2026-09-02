import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
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

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: '昵称不能为空' })
  @MaxLength(20, { message: '昵称最多 20 个字' })
  nickname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30, { message: '身份介绍最多 30 个字' })
  professionalIdentity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300, { message: '简介最多 300 个字' })
  bio?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8, { message: '最多选 8 个技能标签' })
  @IsString({ each: true })
  skillTagNames?: string[];
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

  @Patch('me')
  @ApiOperation({ summary: '更新当前用户资料（昵称/身份/简介/技能标签），设置页统一保存入口' })
  updateProfile(@CurrentUser() user: AuthPayload, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.sub, dto);
  }

  @Patch('me/avatar')
  @ApiOperation({ summary: '更新当前用户头像（前端压缩成 base64 后传入）' })
  updateAvatar(@CurrentUser() user: AuthPayload, @Body() dto: UpdateAvatarDto) {
    return this.usersService.updateAvatar(user.sub, dto.avatarUrl);
  }

  @Get('skill-tags')
  @ApiOperation({ summary: '技能标签目录（设置页选择器用，跟项目发布共用同一份目录）' })
  listSkillTags() {
    return this.usersService.listSkillTags();
  }
}
