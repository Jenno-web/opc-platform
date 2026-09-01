# 培风社 OPC 供需平台

面向自由职业者/独立开发者的 AI 原生供需协作平台。这个仓库是把 [`../OPC项目交付资料_20260731`](../OPC项目交付资料_20260731) 里的产品设计资料（信息架构文档、AI 能力风险矩阵、Figma 低保真原型）转化成的一版**可实际操作的全栈 MVP**——用来验证这套设计方案是否真的能落地成产品，而不只是停留在文档和原型阶段。

**在线体验**：https://opc-platform-frontend.vercel.app/ （手机/电脑浏览器直接打开，自动登录演示账号）
**API 文档**：https://backend-production-4e57.up.railway.app/api/docs
**源代码**：https://github.com/Jenno-web/opc-platform

---

## 目录

- [这个项目做了什么](#这个项目做了什么)
- [技术栈](#技术栈)
- [系统架构](#系统架构)
- [功能清单](#功能清单)
- [数据模型](#数据模型)
- [AI 能力层](#ai-能力层)
- [本地运行](#本地运行)
- [线上部署](#线上部署)
- [对齐 Figma 设计](#对齐-figma-设计)
- [明确做不到 / 刻意简化的部分](#明确做不到--刻意简化的部分)
- [开发过程记录](#开发过程记录)
- [AI 辅助开发说明](#ai-辅助开发说明)

---

## 这个项目做了什么

核心导航：**发现｜任务｜信息｜我的**（+ 悬浮"发布"入口），AI 作为贯穿全流程的能力层（推荐/生成/总结/分析/提取/工作流），而不是一个独立的聊天入口——这是设计资料里反复强调的核心理念，也是这版实现自始至终遵循的原则。

开发分两个阶段：
1. **先把信息架构和 AI 能力跑通**：根据 IA 文档的文字描述，搭出一版能完整操作的全栈应用（五大模块 + 六大 AI 能力）
2. **再对照真实 Figma 设计稿逐屏核对**：用 Figma REST API 读取权威低保真源文件后，发现颜色、导航命名、部分页面结构跟最初做的版本有出入，逐屏核对重做，同时补上了搜索筛选、频道浏览、语音房、发布向导等此前遗漏的模块

## 技术栈

| 层 | 选择 | 理由 |
|---|---|---|
| 前端 | uniapp + Vue3 + TypeScript + Pinia | 一套代码可编译 H5/小程序/App，当前部署 H5；与后端同语言生态，减少心智切换 |
| 后端 | NestJS + TypeScript | 模块化结构天然对应"五大业务模块 + 六大 AI 能力"的划分；内置 Swagger 便于核对数据字段 |
| 数据库 | PostgreSQL + Prisma | 项目/任务/消息/技能标签之间是典型关系型结构；`schema.prisma` 本身就是"数据字段梳理"的产出物 |
| 实时通信 | Socket.IO（NestJS Gateway） | 消息实时推送、语音房在场状态广播 |
| AI 接入 | Provider 抽象层：`MockAIProvider` / `ClaudeAIProvider` | 先用规则模拟把交互跑通，接一个 API Key 就能切换成真实大模型调用，前端零改动 |
| 部署 | Vercel（前端）+ Railway（后端）+ Neon（PostgreSQL） | 都有可用的免费额度，分离部署便于前后端独立扩展 |

## 系统架构

```
┌─────────────────┐        HTTPS/WSS        ┌──────────────────┐        ┌─────────────┐
│  前端 (Vercel)   │ ───────────────────────▶│  后端 (Railway)   │───────▶│ PostgreSQL  │
│  uniapp H5 静态站  │◀─────────────────────── │  NestJS API       │        │  (Neon)     │
└─────────────────┘   REST + WebSocket       └──────────────────┘        └─────────────┘
                                                       │
                                                       ▼
                                              ┌──────────────────┐
                                              │  AIProvider 抽象层 │
                                              │  Mock / Claude    │
                                              └──────────────────┘
```

前端只依赖后端暴露的 REST/WebSocket 接口，不感知 AI 能力背后是 Mock 还是真实模型；后端的 AI 能力层同理不感知调用方是哪个页面，六大能力（推荐/生成/总结/分析/提取/工作流）统一收口在 `apps/backend/src/ai/` 下。

## 功能清单

### 发现（Discover）
- 分类 chips（推荐/悬赏/认证机会/供给/需求）+ 今日匹配横幅
- AI 推荐项目列表（附匹配度与推荐理由）
- 独立搜索与筛选页：供需类型单选、技能多选、预算区间真实生效，结果按 AI 匹配度排序

### 任务（Task）
- 任务状态台：发布中/响应/沟通中统计条 + 状态筛选（全部/待响应/已解决/已过期）
- 供需详情页：AI 项目摘要、AI 匹配提示、发布者认证信息（入驻天数/合作次数/评分）、提问与响应双入口
- 快捷响应页：模板化快速回复 + 自定义留言，区分"提问"（进私信）与"响应"（提交申请）两种意图

### 发布（Publish）
- 4 步向导：意图选择（需求/供给/悬赏）→ 语音或文字表达（H5 环境用浏览器 Web Speech API）→ AI 解析确认（可编辑预算/周期/标签）→ 曝光层级选择（认证发布/付费优先/悬赏任务）

### 信息（Message）
- 私信/项目群/系统通知/申请通知列表，未读数与 WebSocket 实时推送
- 聊天窗口：发消息、AI 对话总结、AI 回复建议、AI 待办提取（提取结果落库为"待确认"待办，需用户手动确认）
- Discord 式频道浏览："培风社官方"社区，频道按分类分组（公告/社区/协作），首次进入自动加入
- 休息室语音房：WebSocket 实时广播"谁在场"（见下方边界说明，不含真实语音通话）

### 我的（Profile）
- 档案完整度评分、技能标签、近期案例作品集
- 项目申请列表、知识库列表与编辑（编辑 AI 生成的复盘内容会标记 `editedByUser`）
- 手机号 + 验证码登录（Mock 短信，验证码直接在响应里返回方便联调）

## 数据模型

核心实体（完整定义见 [`apps/backend/prisma/schema.prisma`](apps/backend/prisma/schema.prisma)）：

- **User**：技能标签、评分、职业身份
- **Project**：`kind`（需求/供给/互助）、`publishTier`（认证发布/付费优先/悬赏）、`status`（招募中/进行中/待确认/已完成/已归档）
- **ProjectRole / Application / ProjectMember**：招募角色、申请、成员关系
- **Task / Todo**：任务拆解、AI 从聊天提取的待办
- **Conversation / ChatMessage / ConversationParticipant**：会话（含 `CHANNEL` 类型的频道）、消息、参与者（含语音房在场状态 `inVoiceRoom`）
- **Review / Portfolio / KnowledgeEntry**：评价、作品集、知识库沉淀
- **AIInteractionLog**：每次 AI 调用的输入/输出/用户处理结果，落地风险矩阵"可追溯、用户确认"的治理要求

## AI 能力层

`apps/backend/src/ai/` 实现六大能力的统一接口（`ai-provider.interface.ts`）：

```
apps/backend/src/ai/
  ai-provider.interface.ts   // 六个方法：推荐/生成/总结/分析/提取/工作流
  mock-ai.provider.ts        // 规则化假数据实现，默认使用
  claude-ai.provider.ts      // 调用 Anthropic Messages API，zod 校验结构化输出，失败重试一次
  ai.service.ts              // 统一入口，所有调用写入 AIInteractionLog
```

切换到真实 Claude API：

```bash
# apps/backend/.env
AI_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...
```

`AI_PROVIDER=claude` 但没配 `ANTHROPIC_API_KEY` 时，**应用启动阶段**就会报错退出，而不是等用户点了某个功能才 500。当前部署的线上版本没有配置 `ANTHROPIC_API_KEY`，跑的是 Mock 模式。

## 本地运行

### 1. 数据库

```bash
# 方式一：Docker
docker compose up -d

# 方式二：本机 Postgres（macOS + Homebrew 示例）
LC_ALL=C /opt/homebrew/opt/postgresql@17/bin/pg_ctl \
  -D "$(pwd)/.pgdata" -o "-p 55432" -l "$(pwd)/.pgdata/server.log" start
# macOS 中文 locale 下必须加 LC_ALL=C，否则 postgres 启动会报"postmaster变成多线程"
```

### 2. 后端

```bash
cd apps/backend
cp .env.example .env        # 按需修改 DATABASE_URL
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

前端首次请求自动调用 `/auth/dev-login`（种子数据里的演示手机号 `13800000001`）换取 JWT，无需手动登录。想体验真实的手机号+验证码登录，去"我的"页点"切换账号"。

## 线上部署

| 服务 | 平台 | 说明 |
|---|---|---|
| 前端 | Vercel | Root Directory = `apps/frontend`，构建命令读 `vercel.json`，环境变量 `VITE_API_BASE_URL`/`VITE_SOCKET_URL` 指向后端域名 |
| 后端 | Railway | Root Directory 留空（仓库根目录），因为是 npm workspaces monorepo，`npm ci` 在子目录里找不到锁文件；构建/启动命令读根目录 `railway.json`，委托给 backend workspace |
| 数据库 | Neon | Serverless PostgreSQL，免费额度不需要绑卡（Railway 自带的 PostgreSQL 新建需要验证信用卡） |

部署过程中排查过的几个坑（供参考）：
- **monorepo 锁文件问题**：Root Directory 设成子目录会导致 `npm ci` 找不到仓库根目录的 `package-lock.json`；改成根目录 `package.json` 里加 `build`/`start` 脚本委托给对应 workspace，不依赖 Railway UI 手填的 Build/Start Command
- **`nest build` 输出路径错乱**：`tsconfig.build.json` 没显式设 `rootDir`，TS 会把 `prisma/seed.ts`（在 `src` 目录之外）也算进公共根路径，导致 `main.js` 被编译到 `dist/src/main.js` 而不是 `dist/main.js`，跟启动命令对不上——加 `rootDir: "src"` 并排除 `prisma` 目录解决
- **`npm ci` 与构建缓存冲突**：Railway 的 Nixpacks 会把 `node_modules/.cache` 挂载成缓存卷，`npm ci` 清空重装 `node_modules` 时会撞上这个挂载锁报 `EBUSY`，改用 `npm install` 避开
- **Node 版本**：Railway 默认探测到的 Node 版本低于 NestJS 11 要求，加 `engines.node` + `.nvmrc` 显式指定

## 对齐 Figma 设计

最初的前端配色（蓝色主色+紫色 AI 强调色）和信息架构是照着 IA 文档的文字描述 + 网页概念报告里的彩色原型截图做的，跟真正的 Figma 低保真源文件（`OPC供需平台_移动端设计稿...20260526.fig`）没有直接关系。拿到 Figma Personal Access Token 后，用 Figma REST API 完整读取了权威画布（18 个画板），发现真实设计和最初做的差异很大：

- **配色系统重做**：`apps/frontend/src/styles/tokens.scss` 换成从 Figma 里读出来的真实取值——纯黑白灰（`#111111`/`#777777`/`#ffffff`/`#f5f5f3`），零彩色，AI 相关内容靠加粗+图标区分，不靠颜色。字体加了 SF Pro 兜底栈
- **底部导航改名**：真实设计是"发现/信息/任务/我的"四个常驻 Tab + 悬浮"发布"按钮，不是五个平级 Tab
- **五大画板按真实文案/结构重做**：发现页、供需详情页、任务状态台、我的档案页
- **此前完全没做的模块补上了**：搜索筛选页、响应/联系页、4 步发布向导、Discord 式频道浏览与语音房
- **数据模型新增**：`Project.kind`（需求/供给/互助）、`Project.publishTier`（认证发布/付费优先/悬赏）、`Conversation` 的频道与语音房字段

## 明确做不到 / 刻意简化的部分

诚实列出这次没做到、或者刻意简化的地方，而不是含糊带过：

- **语音房只有"谁在场"，没有真实语音通话**：复用已有 WebSocket 网关实时广播加入/离开状态，但不传输真实音频——需要 WebRTC/媒体服务器（Agora、LiveKit 这类），是完全不同量级的基础设施投入
- **详情页"原始语音"用文字转写代替**：不做真实录音文件的存储/回放，复用发布向导已有的语音转文字文本
- **搜索页部分筛选项是视觉占位**：供需类型/技能多选/预算区间三项真实生效；"资源置换/算力额度/长短期合作方式"这几个 chip 只做了视觉还原，没接真实筛选逻辑
- **只做单社区**：Figma 顶部有服务器切换图标，但只有"培风社官方"一个社区有真实设计内容，没有做多服务器数据模型
- **间距/字号是从设计稿精确值换算的，但没有自动化视觉回归**：Phase 6 用 Figma API 重新读取了全部画板的 Auto Layout 精确数值（`itemSpacing`/`padding`/`cornerRadius`/`fontSize`），按 uni-app rpx 与 Figma 画板的真实比例（750/402 ≈ 1.866）换算后写进 `tokens.scss` 和各页面样式，不再是估算或 1:1 硬套；但开发环境装不了 Chromium/Playwright，做不了截图级像素比对，最终视觉效果仍需要人工打开浏览器确认
- **交互动效是补的，不是从设计稿读出来的**：核对过 Figma 文件里所有节点的 `interactions` 字段，全部是空数组——低保真稿本身没有定义任何原型跳转/动效。点击反馈（`hover-class`）、加载骨架屏、空状态、卡片入场动效、语音输入脉冲这些是按通用移动端交互规范另外设计并实现的，不是从设计稿里还原的
- **没做整页滑动转场**：uni-app 的 `animationType` 页面转场只对 App 端生效，H5 端要做等价效果需要接管 uni-app 自己的页面栈路由，改动风险和收益不成比例，这次没做
- **图标是手工画的基础图形，不是引入 Lucide 包**：Figma 组件命名（"Lucide / compass" 这类）说明设计意图是用 Lucide 风格图标，但项目里没有真的装这个包，而是用 `line`/`circle`/`polyline` 等 SVG 基础图形手工绘制、视觉上贴近同一种描边风格（`components/Icon.vue`），没有照抄 Lucide 源码的路径数据
- **头像是精致化的文字头像，不是真实照片**：`avatarUrl` 在种子数据里从来没被赋值过，后端也没有任何图片上传/处理逻辑，所以现在、以后短期内都不会有真实用户头像。没有接入第三方头像图库去"伪装"成真实头像，`components/Avatar.vue` 统一做的是把"取昵称首字母"这个方案做得更精致（描边环、字重、尺寸 token 化），不是找假图片替代
- **真实 Claude API 没有联调验证**：代码已就绪（zod 校验、失败重试、启动期配置校验），但没有 `ANTHROPIC_API_KEY`，没有实际验证过真实模型调用效果
- **真实短信服务商没有接入**：`SmsProvider` 接口已抽象好，`MockSmsProvider` 是当前唯一实现，接入阿里云/腾讯云等需要对应账号
- **小程序/App 没有正式发布**：`npm run build:mp-weixin` 已验证能正常编译出完整小程序包，但发布需要微信开发者账号 / Apple/Google 开发者账号
- **验证码存在后端内存里**：重启服务会丢失、多实例部署也不共享，生产环境应该换成 Redis
- **前端 SCSS 用 `@import` 语法**：Dart Sass 已标记废弃（3.0 会移除），功能不受影响，后续可迁移到 `@use`

## 开发过程记录

按实际开发顺序保留的阶段记录，供回顾整个过程：

1. **Phase 1（走通骨架）**：完整数据模型、五大模块后端 API + Swagger、六大 AI 能力抽象层、前端五 Tab 外壳
2. **Phase 2（深度交互）**：消息页聊天窗口（AI 总结/回复建议/待办提取）、语音输入、"申请加入"完整流程、知识库编辑
3. **Phase 3（真实 AI 接入的工程准备）**：`ClaudeAIProvider` 补充 zod 校验、失败重试、超时、启动期配置校验
4. **Phase 4（实时通信与真实鉴权）**：WebSocket 消息推送、短信验证码可插拔登录、小程序编译验证
5. **Phase 5（对齐 Figma 真实设计）**：见上方"对齐 Figma 设计"一节，是工作量最大的一次返工
6. **部署上线**：Vercel + Railway + Neon，排查 monorepo 构建、Node 版本、npm 缓存等一系列部署问题
7. **Phase 6（高保真页面与交互）**：重新用 Figma API 拉取全部 18 个画板的 Auto Layout 精确数值，修正了 Phase 5 里"pt 数值直接当 rpx 用"的换算错误（正确比例应为 750/402≈1.866），扩展出真实的间距/字号刻度 token；新增 `SkeletonBlock`/`EmptyState` 共享组件替换纯文字加载态；给全部可点击元素加 `hover-class` 点击反馈；补了卡片入场动效、语音输入脉冲动效
8. **Phase 7（图标系统与层次）**：意识到"精确对齐低保真稿"天花板还是低保真——低保真源文件本身没有真实图标、阴影层次、头像视觉。新增 `Icon.vue`（手工绘制的描边图标）替换全部文字/emoji 占位符；用 Pillow 生成底部 Tab 的真实图标（`compass`/`list-checks`/`message-circle`/`user-round`），补上 `pages.json` 里此前完全没配置过的 `iconPath`；新增阴影 token 给卡片补层次；新增 `Avatar.vue` 统一三处写法不一致的头像逻辑

## AI 辅助开发说明

这个项目的具体代码是在 AI 编程工具（Claude Code）辅助下完成的。如实说明分工：

- **产品判断与决策**：读完设计资料后判断"应该做成真实可跑的产品"；每一步的关键决策（技术方向、MVP 范围、要不要接真实大模型、发现视觉不对后要不要推翻重做、部署方式怎么选）都是人工拍板
- **账号与授权**：Figma、GitHub、Railway、Vercel、Neon 账号的注册和授权都是人工操作完成，AI 无法代劳
- **部署调试**：部署上线过程中遇到的一系列报错（配置文件路径、Node 版本、构建缓存冲突、环境变量、运行时崩溃）是人工在对应平台的控制台里操作、截图、反馈报错信息，与 AI 多轮排查解决的
- **代码实现**：具体的数据库设计、后端接口、前端页面代码由 AI 编程工具在上述决策指导下完成
