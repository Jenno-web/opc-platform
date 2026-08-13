import { ApiProperty } from '@nestjs/swagger';
import { ProjectKind, PublishTier } from '@prisma/client';
import { ArrayMaxSize, IsArray, IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  title: string;

  @ApiProperty()
  @IsString()
  background: string;

  @ApiProperty()
  @IsString()
  goal: string;

  @ApiProperty()
  @IsString()
  coreFeatures: string;

  @ApiProperty()
  @IsString()
  deliverables: string;

  @ApiProperty()
  @IsString()
  acceptanceCriteria: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  budgetMin: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  budgetMax: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  cycleWeeks: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  skillTagNames: string[];

  @ApiProperty({ enum: ProjectKind, required: false, description: '需求/供给/互助，对应发布向导第 1 步选的意图' })
  @IsOptional()
  @IsEnum(ProjectKind)
  kind?: ProjectKind;

  @ApiProperty({ enum: PublishTier, required: false, description: '曝光层级，对应发布向导第 4 步' })
  @IsOptional()
  @IsEnum(PublishTier)
  publishTier?: PublishTier;
}
