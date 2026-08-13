# 培风社 OPC 供需平台

面向自由职业者/独立开发者的 AI 原生供需协作平台。核心导航：**发现｜任务｜信息｜我的**（+ 悬浮"发布"入口），AI 作为贯穿全流程的能力层（推荐/生成/总结/分析/提取/工作流），而非独立聊天入口。

本仓库是 [`../OPC项目交付资料_20260731`](../OPC项目交付资料_20260731) 里的产品设计资料转化成的可运行 MVP：完整外壳 + 假数据，AI 能力默认走规则化 Mock，可一键切换到真实 Claude API。前端视觉与信息架构已对照 **Figma 低保真源文件**（通过 Figma REST API 用用户提供的 Personal Access Token 读取，见下方"对齐 Figma 设计"一节）逐屏核对，不是凭感觉配色/编的页面结构。

## 目录结构

```text
opc-platform/
├── apps/
│   ├── backend/    # NestJS + Prisma + PostgreSQL
│   └── frontend/   # uniapp (Vue3 + TS)，H5 优先
├── docker-compose.yml   # 可选：用 Docker 起 PostgreSQL
└── package.json         # npm workspaces 根
```

## 快速启动

### 1. 数据库

本机开发环境用 Homebrew 直接起了一个**独立**的本地 PostgreSQL 实例（数据目录在 `apps/../.pgdata`，端口 `55432`），没有用 `docker-compose.yml`——当时开发环境里 Docker Hub 镜像拉取网络不通。`docker-compose.yml` 仍然保留作为团队协作时的标准方式，两种方式二选一：

```bash
# 方式一：本机直接起 Postgres（当前开发环境在用）
LC_ALL=C /opt/homebrew/opt/postgresql@17/bin/pg_ctl \
  -D "$(pwd)/.pgdata" -o "-p 55432" -l "$(pwd)/.pgdata/server.log" start
# 注意：macOS 上某些中文 locale 会导致 postgres 启动失败（"postmaster变成多线程"），
# 必须加 LC_ALL=C

# 方式二：Docker（网络通畅时）
docker compose up -d   # 对应 apps/backend/.env 里 DATABASE_URL 改回 5432 端口
```

### 2. 后端

```bash
cd apps/backend
cp .env.example .env        # 首次需要，按需修改 DATABASE_URL
npm install
npm run prisma:generate
npm run prisma:migrate      # 建表
npm run prisma:seed         # 灌入自由职业语境假数据
npm run start:dev           # http://localhost:3000/api ，文档在 /api/docs
```

### 3. 前端

```bash
cd apps/frontend
npm install
npm run dev:h5              # http://localhost:5173
```

前端首次请求会自动调用 `/auth/dev-login`（用种子数据里的演示手机号 `13800000001`）换取 JWT 并存入本地存储，无需手动登录。想体验真实的手机号+验证码登录，去"我的"页点"切换账号（手机号登录）"。

## 技术选型

| 层 | 选择 |
|---|---|
| 前端 | uniapp + Vue3 + TypeScript + Pinia（H5 优先，可编译小程序/App） |
| 后端 | NestJS + TypeScript |
| 数据库 | PostgreSQL + Prisma（当前锁定 6.x，7.x 引入了 driver-adapter breaking change，暂不跟进） |
| AI | Provider 抽象层，`AI_PROVIDER=mock`（默认）\| `claude`（真实 Anthropic API） |

## AI 能力层

`apps/backend/src/ai/` 实现六大能力的统一接口（`ai-provider.interface.ts`），`MockAIProvider` 用规则/模板模拟输出，`ClaudeAIProvider` 调用真实 Claude API。切换方式：

```bash
# apps/backend/.env
AI_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...
```

每次 AI 调用都会写入 `AIInteractionLog` 表（`inputRef`/`outputRaw`/`sourceContentRef`/`userAction`），落地风险矩阵里"可追溯、用户确认"的治理要求——不管走 Mock 还是真实模型都一样。

`ClaudeAIProvider` 每个方法都用 zod schema 校验模型返回的 JSON 结构；校验失败会把错误信息带回给模型重试一次，两次都失败才抛异常，避免模型输出格式跑偏时脏数据流入数据库。请求有 20s 超时保护。`AI_PROVIDER=claude` 但没配 `ANTHROPIC_API_KEY` 时，**应用启动阶段**就会报错退出（而不是等到用户点了某个 AI 功能才 500），错误信息会直接告诉你该改哪个环境变量。

> 这个仓库当前没有配置 `ANTHROPIC_API_KEY`，所以一直跑在 Mock 模式下——切换到真实调用需要你自己申请一个 Key 填进 `.env`。

## 假数据说明

`apps/backend/prisma/seed.ts` 用的是自由职业语境的示例（真实预算区间、真实技能标签、真实客户/合作者角色），**没有**沿用网页概念报告原型截图里的"校园/课程项目"示例数据（智能校园助手、大学生、张老师等）——那套示例与 OPC 面向自由职业者/独立开发者的定位不符。

## 对齐 Figma 设计（Phase 5）

最初的前端配色（蓝色主色+紫色 AI 强调色）和信息架构是照着 IA 文档的文字描述 + 网页概念报告里的彩色原型截图做的，跟真正的 Figma 低保真源文件（`OPC供需平台_移动端设计稿...20260526.fig`）没有直接关系。拿到 Figma Personal Access Token 后，用 Figma REST API 完整读取了权威画布（`101:1438`，18 个画板），发现真实设计和之前做的差异很大，对齐工作包括：

- **配色系统重做**：`apps/frontend/src/styles/tokens.scss` 换成从 Figma 里读出来的真实取值——纯黑白灰（`#111111`/`#777777`/`#ffffff`/`#f5f5f3`），零彩色，AI 相关内容靠加粗+图标区分，不靠颜色。字体加了 SF Pro 兜底栈。
- **底部导航改名**：真实设计是"发现/信息/任务/我的"四个常驻 Tab + 悬浮"发布"按钮（`components/PublishFab.vue`），不是五个平级 Tab。
- **五大画板按真实文案/结构重做**：发现页（分类 chips + 今日匹配横幅）、供需详情页（AI 匹配提示 + 发布者认证信息 + 提问/响应双按钮）、任务状态台（统计条 + 状态筛选 + 发布者专属操作）、我的档案页（完整度评分 + 我能提供 + 近期案例作品集）。
- **此前完全没做的模块，这次补上了**：搜索与筛选页（技能/预算/供需类型真实筛选 + AI 匹配度）、响应/联系页（快捷模板）、发布向导从单页改成 4 步流程（意图选择→语音表达→AI 解析确认→曝光层级选择）、Discord 式的频道浏览与休息室语音房。
- **数据模型新增**：`ConversationType.CHANNEL`、`Conversation.category`/`isVoiceRoom`、`ConversationParticipant.inVoiceRoom`、`Project.kind`（需求/供给/互助）、`Project.publishTier`（认证发布/付费优先/悬赏）。

### 明确做不到 / 刻意简化的部分

- **语音房只有"谁在场"，没有真实语音通话**：`pages/message/voice-room.vue` 复用已有 WebSocket 网关实时广播加入/离开状态，但不传输真实音频——那需要 WebRTC/媒体服务器（Agora、LiveKit 这类），是完全不同量级的基础设施投入，这个开发环境搭不了。
- **详情页"原始语音"用文字转写代替**：不做真实录音文件的存储/回放（需要文件存储服务），复用发布向导已有的语音转文字文本。
- **搜索页部分筛选项是视觉占位**：供需类型/技能多选/预算区间三项真实生效；"资源置换/算力额度/长短期合作方式"这几个 chip 只做了视觉还原（HTML 里标了 `is-static`），没接真实筛选逻辑。
- **只做单社区**：Figma 顶部有"私/官/会/战"服务器切换图标，但只有"培风社官方"一个社区有真实设计内容，没有做多服务器数据模型。
- **不是像素级视觉还原**：颜色、字体、圆角、文案、页面结构都是从 Figma 数据里读出来对齐的；但间距/字号这类像素级细节是靠读 JSON 里的坐标推算的——这个环境没有 Chromium/Playwright 截图比对工具（下载被网络环境挡住了，见 Phase 1 记录），没法做视觉回归测试，只能保证"同一套设计语言"，不保证每个像素都对得上。

## 本次已实现

**Phase 1（走通骨架）**
- 完整数据模型（用户/项目/申请/任务/会话/消息/待办/评价/作品集/知识库/AI 追溯日志）
- 五大模块后端 API + Swagger 文档
- 六大 AI 能力抽象层（Mock 默认，Claude 可切换）
- 前端五 Tab 外壳，发现页、项目页（列表+详情）完整数据闭环

**Phase 2（深度交互）**
- 消息页聊天窗口（`pages/message/chat.vue`）：发送消息、AI 对话总结、AI 回复建议、AI 待办提取（提取结果落库为"待确认"待办，需用户在消息页手动确认，对应风险矩阵的确认机制）
- 发布页语音输入：H5 环境下用浏览器 Web Speech API 做语音转文字，非 H5 环境自动降级为提示直接输入文字
- 项目详情页"申请加入"完整流程：AI 生成申请文案 → 用户可编辑 → 确认提交
- 我的页新增"项目申请"列表页、"知识库"列表/编辑页（编辑 AI 生成的复盘内容会标记 `editedByUser`）

**Phase 3（真实 AI 接入的工程准备）**
- `ClaudeAIProvider` 补充 zod 结构化输出校验、失败重试、请求超时、启动期配置校验（见上一节）
- 受限于当前环境没有 `ANTHROPIC_API_KEY`，没有做成真实模型调用的联调验证，只做到"代码就绪、配置齐全就能切换"

**Phase 4（部分完成，见下方"本次未完成"）**
- 消息实时推送：`apps/backend/src/realtime/chat.gateway.ts`（NestJS + socket.io，JWT 鉴权握手），REST 发消息成功后通过 WebSocket 把消息实时推给会话其余参与者，AI 提取待办后也会实时推送。前端 `src/utils/socket.ts` 封装连接（H5 环境专用，非 H5 优雅降级为纯 REST 轮询）。已用真实 socket 客户端端到端验证过
- 真实鉴权：新增 `/auth/send-code`、`/auth/verify-code`，验证码生成/校验/签发 token 的逻辑和短信发送渠道解耦（`SmsProvider` 接口 + `MockSmsProvider`，和 AI 能力层是同一个设计模式）。当前只有 Mock 实现——没接真实短信服务商（需要你自己的阿里云/腾讯云账号），Mock 模式下验证码会直接带在接口响应里方便联调。前端新增 `pages/login/index.vue` 手机号登录页，"我的"页可以切换过去体验
- 小程序编译：`npm run build:mp-weixin` 已验证能正常编译出完整小程序包（`dist/build/mp-weixin`）

## 本次未完成 / 需要你接手的部分

- **真实 Claude API 联调**：代码已就绪，需要你提供 `ANTHROPIC_API_KEY` 并设置 `AI_PROVIDER=claude` 后实际验证效果
- **真实短信服务商接入**：需要你自己的短信服务商账号（阿里云/腾讯云等），新写一个实现 `SmsProvider` 接口的 Provider，在 `auth.module.ts` 里换掉 `MockSmsProvider` 即可，`AuthService` 不需要改动
- **小程序/App 发布**：小程序发布需要在微信开发者工具里用你自己的 AppID 手动导入 `dist/build/mp-weixin` 并提交审核；App 发布需要 Apple/Google 开发者账号走原生打包流程。这两步都涉及需要你亲自操作的外部账号体系，没法在这个开发环境里自动化完成

以下两项不是"缺账号"，是这个开发环境本身的基础设施限制，即使你提供账号/密钥也解决不了，需要换开发环境或额外接入专门服务：

- **语音房真实语音通话**：需要接入 WebRTC/媒体服务器（Agora、LiveKit 等），目前只有"谁在场"的实时状态
- **Figma 像素级视觉回归**：这个环境下载不了 Chromium/Playwright（网络受限），没法做自动化截图比对，颜色/文案/结构已对齐，但间距字号这类细节需要你自己在浏览器里目测微调

## 已知待打磨项

- 前端 SCSS 用的是 `@import` 语法，Dart Sass 提示已废弃（将在 3.0 移除），功能不受影响，后续可迁移到 `@use`。
- 语音输入依赖浏览器 Web Speech API，目前只在 H5 + Chrome 系内核验证过。
- 验证码目前存在后端内存里（`Map`），重启服务会丢失、多实例部署也不共享，生产环境应该换成 Redis。
