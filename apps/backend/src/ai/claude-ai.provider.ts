import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
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

const REQUEST_TIMEOUT_MS = 20_000;
const MAX_ATTEMPTS = 2;

const recommendSchema = z.array(z.object({ projectId: z.string(), score: z.number(), reason: z.string() }));
const draftSchema = z.object({
  direction: z.string(),
  targetUser: z.string(),
  background: z.string(),
  goal: z.string(),
  coreFeatures: z.string(),
  deliverables: z.string(),
  missingFields: z.array(z.string()),
});
const summarySchema = z.object({ summary: z.string() });
const matchSchema = z.object({ score: z.number(), reason: z.string() });
const todosSchema = z.array(
  z.object({ content: z.string(), assignee: z.string().optional(), dueDate: z.string().optional() }),
);
const replySchema = z.object({ reply: z.string() });
const applicationSchema = z.object({ content: z.string() });

/**
 * 接入真实 Anthropic Claude API 的 Provider（Phase 3）。
 * 通过 ANTHROPIC_API_KEY 环境变量启用，AI_PROVIDER=claude 时由 AiModule 注入。
 *
 * 每个方法都用 zod schema 校验模型返回的 JSON 结构：
 * 校验失败时会把错误信息喂回给模型重试一次，两次都失败才向上抛异常，
 * 避免"模型输出格式跑偏"直接把脏数据写进数据库或返回给前端。
 */
@Injectable()
export class ClaudeAIProvider implements AIProvider {
  private readonly logger = new Logger(ClaudeAIProvider.name);
  private readonly apiKey: string;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('ANTHROPIC_API_KEY', '');
    this.model = this.config.get<string>('ANTHROPIC_MODEL', 'claude-sonnet-5');
  }

  private async callClaudeOnce(systemPrompt: string, userPrompt: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Claude API 调用失败: ${response.status} ${text}`);
      }

      const data = (await response.json()) as { content: { type: string; text?: string }[] };
      return data.content.find((block) => block.type === 'text')?.text ?? '{}';
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`Claude API 请求超时（超过 ${REQUEST_TIMEOUT_MS / 1000}s）`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * 调用模型并用 schema 校验结构化输出，失败最多重试一次（把 zod 的错误信息带回给模型）。
   */
  private async callClaudeJSON<T>(schema: z.ZodType<T>, systemPrompt: string, userPrompt: string): Promise<T> {
    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY 未配置，无法调用真实 Claude API');
    }

    let lastError: unknown;
    let prompt = userPrompt;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const text = await this.callClaudeOnce(systemPrompt, prompt);
        const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        const parsed: unknown = JSON.parse(jsonMatch ? jsonMatch[0] : text);
        return schema.parse(parsed);
      } catch (err) {
        lastError = err;
        const reason = err instanceof z.ZodError ? JSON.stringify(err.issues) : String(err);
        this.logger.warn(`Claude 输出校验失败（第 ${attempt} 次）：${reason}`);
        // 把上一次的错误原因带回给模型，要求严格按 schema 重新输出
        prompt = `${userPrompt}\n\n上一次的输出不符合要求，原因：${reason}\n请严格按格式重新输出。`;
      }
    }

    this.logger.error(`Claude API 调用最终失败：${String(lastError)}`);
    throw new Error('AI 服务暂时不可用，请稍后重试');
  }

  async recommendProjects(
    userSkillTags: string[],
    candidates: RecommendCandidate[],
  ): Promise<RecommendOutput[]> {
    return this.callClaudeJSON(
      recommendSchema,
      '你是 OPC 供需平台的项目推荐助手，只输出 JSON 数组，不要输出多余文字。',
      `用户技能标签：${JSON.stringify(userSkillTags)}\n候选项目：${JSON.stringify(candidates)}\n请为每个项目打分(0-100)并给出一句推荐理由，返回 [{"projectId":"","score":0,"reason":""}]`,
    );
  }

  async generateProjectDraft(idea: string): Promise<GenerateDraftOutput> {
    return this.callClaudeJSON(
      draftSchema,
      '你是 OPC 供需平台的需求整理助手，把用户的一句话想法转成结构化项目草稿，只输出 JSON，不要输出多余文字。',
      `用户想法：${idea}\n请返回 {"direction":"","targetUser":"","background":"","goal":"","coreFeatures":"","deliverables":"","missingFields":[]}`,
    );
  }

  async summarizeContent(content: string): Promise<string> {
    const result = await this.callClaudeJSON(
      summarySchema,
      '你是内容总结助手，只输出 JSON，不要输出多余文字。',
      `请总结以下内容，控制在 80 字以内：${content}\n返回 {"summary":""}`,
    );
    return result.summary;
  }

  async analyzeMatch(userSkillTags: string[], projectSkillTags: string[]): Promise<MatchAnalysisOutput> {
    return this.callClaudeJSON(
      matchSchema,
      '你是匹配分析助手，只输出 JSON，不要输出多余文字。',
      `用户技能：${JSON.stringify(userSkillTags)}\n项目所需技能：${JSON.stringify(projectSkillTags)}\n请分析匹配度(0-100)并给出理由，返回 {"score":0,"reason":""}`,
    );
  }

  async extractTodos(chatContent: string): Promise<ExtractedTodo[]> {
    return this.callClaudeJSON(
      todosSchema,
      '你是待办事项提取助手，只输出 JSON 数组，不要输出多余文字。',
      `请从以下聊天内容中提取待办事项：${chatContent}\n返回 [{"content":"","assignee":"","dueDate":""}]`,
    );
  }

  async suggestReply(chatContent: string): Promise<string> {
    const result = await this.callClaudeJSON(
      replySchema,
      '你是聊天回复助手，只输出 JSON，不要输出多余文字。',
      `请根据以下聊天记录，给出一条得体的回复建议：${chatContent}\n返回 {"reply":""}`,
    );
    return result.reply;
  }

  async generateApplicationContent(
    project: ApplicationTargetProject,
    applicant: ApplicantProfile,
  ): Promise<string> {
    const result = await this.callClaudeJSON(
      applicationSchema,
      '你是项目申请文案助手，只输出 JSON，不要输出多余文字。',
      `项目信息：${JSON.stringify(project)}\n申请人资料：${JSON.stringify(applicant)}\n请生成一段简洁得体的项目申请文案，返回 {"content":""}`,
    );
    return result.content;
  }
}
