import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ProjectKind, ProjectStatus, PublishTier } from '@prisma/client';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthPayload } from '../common/jwt-auth.guard';

class UpdateProjectStatusDto {
  @IsEnum(ProjectStatus)
  status: ProjectStatus;
}

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: '项目列表：支持按关键词/状态/供需类型/曝光层级筛选（对应发现页）' })
  list(
    @Query('keyword') keyword?: string,
    @Query('status') status?: ProjectStatus,
    @Query('sort') sort?: string,
    @Query('kind') kind?: ProjectKind,
    @Query('publishTier') publishTier?: PublishTier,
  ) {
    return this.projectsService.list({ keyword, status, sort, kind, publishTier });
  }

  @Get('mine')
  @ApiOperation({ summary: '我发布/参与的项目（对应任务&状态台，区别于发现页的全平台列表）' })
  listMine(@CurrentUser() user: AuthPayload, @Query('status') status?: ProjectStatus) {
    return this.projectsService.listMine(user.sub, status);
  }

  @Get('mine/stats')
  @ApiOperation({ summary: '任务状态台顶部统计条：发布中/收到的响应/沟通中' })
  myStats(@CurrentUser() user: AuthPayload) {
    return this.projectsService.myStats(user.sub);
  }

  @Get('search')
  @ApiOperation({ summary: '搜索与筛选：技能多选+预算区间+供需类型，结果带 AI 匹配度（对应 02 号画板）' })
  search(
    @CurrentUser() user: AuthPayload,
    @Query('keyword') keyword?: string,
    @Query('kind') kind?: ProjectKind,
    @Query('skillNames') skillNames?: string,
    @Query('budgetMin') budgetMin?: string,
    @Query('budgetMax') budgetMax?: string,
  ) {
    return this.projectsService.search(user.sub, {
      keyword,
      kind,
      skillNames: skillNames ? skillNames.split(',').filter(Boolean) : undefined,
      budgetMin: budgetMin ? Number(budgetMin) : undefined,
      budgetMax: budgetMax ? Number(budgetMax) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '项目详情，附带 AI 摘要（对应项目详情页）' })
  detail(@Param('id') id: string, @CurrentUser() user: AuthPayload) {
    return this.projectsService.detail(id, user.sub);
  }

  @Post()
  @ApiOperation({ summary: '发布项目（对应发布向导最后一步确认发布）' })
  create(@CurrentUser() user: AuthPayload, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(user.sub, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '修改项目状态（对应任务状态台"下架/标记解决"，仅发布者可操作）' })
  updateStatus(@Param('id') id: string, @CurrentUser() user: AuthPayload, @Body() dto: UpdateProjectStatusDto) {
    return this.projectsService.updateStatus(user.sub, id, dto.status);
  }
}
