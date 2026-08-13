import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthPayload } from '../common/jwt-auth.guard';

@ApiTags('applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get('mine')
  @ApiOperation({ summary: '我的申请列表（对应"我的"页项目申请）' })
  listMine(@CurrentUser() user: AuthPayload) {
    return this.applicationsService.listMine(user.sub);
  }

  @Post()
  @ApiOperation({ summary: '提交项目申请（对应项目详情页"申请加入"）' })
  create(@CurrentUser() user: AuthPayload, @Body() dto: CreateApplicationDto) {
    return this.applicationsService.create(user.sub, dto.projectId, dto.content, dto.roleId, dto.aiGenerated);
  }
}
