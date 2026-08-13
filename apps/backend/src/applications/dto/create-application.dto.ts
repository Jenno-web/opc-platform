import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateApplicationDto {
  @ApiProperty()
  @IsString()
  projectId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  roleId?: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  content: string;

  @ApiProperty({ required: false, description: '申请文案是否来自 AI 生成（即使用户已编辑过）' })
  @IsOptional()
  @IsBoolean()
  aiGenerated?: boolean;
}
