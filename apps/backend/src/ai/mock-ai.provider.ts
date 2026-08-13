import { Injectable } from '@nestjs/common';
import type {
  AIProvider,
  ApplicantProfile,
  ApplicationTargetProject,
  ExtractedTodo,
  GenerateDraftOutput,
  MatchAnalysisOutput,
  RecommendCandidate,
  RecommendOutput,
} from './ai-provider.interface';

/**
 * MVP 阶段默认 Provider：用规则/模板模拟六大 AI 能力的输出，
 * 保证前端交互可以完整跑通，且返回结构与 ClaudeAIProvider 完全一致，
 * 切换 AI_PROVIDER=claude 时前端无需任何改动。
 */
@Injectable()
export class MockAIProvider implements AIProvider {
  async recommendProjects(
    userSkillTags: string[],
    candidates: RecommendCandidate[],
  ): Promise<RecommendOutput[]> {
    return candidates
      .map((candidate) => {
        const overlap = candidate.skillTagNames.filter((tag) => userSkillTags.includes(tag));
        const score = userSkillTags.length
          ? Math.round((overlap.length / userSkillTags.length) * 60 + 35)
          : 60;
        const reason = overlap.length
          ? `具备「${overlap.join('、')}」相关经验`
          : '与你近期浏览的项目方向接近';
        return { projectId: candidate.projectId, score: Math.min(score, 98), reason };
      })
      .sort((a, b) => b.score - a.score);
  }

  async generateProjectDraft(idea: string): Promise<GenerateDraftOutput> {
    const trimmed = idea.trim();
    return {
      direction: trimmed.length > 20 ? `${trimmed.slice(0, 20)}...` : trimmed,
      targetUser: '待确认（可在下方补充）',
      background: `用户描述的项目想法：${trimmed}`,
      goal: `围绕"${trimmed}"完成一个可交付的最小可用版本`,
      coreFeatures: '核心功能待细化，建议在确认前补充 2-3 个关键功能点',
      deliverables: '可运行的产品原型 / 代码交付物',
      missingFields: ['项目预算', '项目周期', '技能要求'],
    };
  }

  async summarizeContent(content: string): Promise<string> {
    const clean = content.replace(/\s+/g, ' ').trim();
    return clean.length > 60 ? `${clean.slice(0, 60)}...` : clean;
  }

  async analyzeMatch(userSkillTags: string[], projectSkillTags: string[]): Promise<MatchAnalysisOutput> {
    const overlap = projectSkillTags.filter((tag) => userSkillTags.includes(tag));
    const score = projectSkillTags.length
      ? Math.round((overlap.length / projectSkillTags.length) * 100)
      : 50;
    const reason = overlap.length
      ? `技能匹配：${overlap.join('、')}`
      : '技能重合度较低，建议查看项目详情后再决定';
    return { score, reason };
  }

  async extractTodos(chatContent: string): Promise<ExtractedTodo[]> {
    return chatContent
      .split(/[\n,，、]/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 4)
      .slice(0, 5)
      .map((content) => ({ content }));
  }

  async suggestReply(chatContent: string): Promise<string> {
    const lastLine = chatContent.trim().split(/\n/).pop() ?? chatContent;
    return `收到，关于"${lastLine.slice(0, 20)}"我会尽快处理，稍后同步进展给你。`;
  }

  async generateApplicationContent(
    project: ApplicationTargetProject,
    applicant: ApplicantProfile,
  ): Promise<string> {
    const skills = applicant.skillTagNames.length ? applicant.skillTagNames.join('、') : '相关领域';
    return [
      `您好，我是${applicant.nickname}${applicant.professionalIdentity ? `（${applicant.professionalIdentity}）` : ''}，`,
      `看到「${project.title}」这个项目，目标是"${project.goal}"，与我在${skills}方面的经验比较契合。`,
      applicant.bio ? applicant.bio : '',
      `希望能加入一起把「${project.coreFeatures}」这部分做好，期待进一步沟通。`,
    ]
      .filter(Boolean)
      .join('\n');
  }
}
