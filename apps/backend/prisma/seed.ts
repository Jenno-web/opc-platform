import { PrismaClient, Project } from '@prisma/client';

const prisma = new PrismaClient();

// 自由职业语境的假数据：真实预算区间、真实技能标签、真实客户/合作者角色。
// 刻意不沿用网页概念报告原型截图里的"校园/课程项目"示例（智能校园助手、大学生、张老师等），
// 因为那套示例数据与 OPC 面向自由职业者/独立开发者的定位不符（详见项目分析记录）。

const SKILLS = [
  '产品设计',
  '前端开发',
  '后端开发',
  'UI设计',
  '需求分析',
  'AI工具',
  '数据分析',
  '小程序开发',
  '品牌设计',
  '增长运营',
];

async function main() {
  console.log('清空旧数据...');
  await prisma.aIInteractionLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.knowledgeEntry.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.review.deleteMany();
  await prisma.todo.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.application.deleteMany();
  await prisma.projectRole.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.skillTag.deleteMany();

  console.log('创建技能标签...');
  const skillTags = await Promise.all(
    SKILLS.map((name) => prisma.skillTag.create({ data: { name } })),
  );
  const skillByName = new Map(skillTags.map((tag) => [tag.name, tag]));

  console.log('创建用户...');
  const demoUser = await prisma.user.create({
    data: {
      phone: '13800000001',
      nickname: '陈小舟',
      professionalIdentity: '独立产品设计师 / 自由职业',
      bio: '5 年 To B 产品设计经验，专注 AI 工具类产品的信息架构与交互设计。',
      ratingAvg: 4.8,
      ratingCount: 12,
      skillTags: { connect: [{ id: skillByName.get('产品设计')!.id }, { id: skillByName.get('需求分析')!.id }, { id: skillByName.get('AI工具')!.id }] },
    },
  });

  const otherUsers = await Promise.all([
    prisma.user.create({
      data: {
        phone: '13800000002',
        nickname: '林工',
        professionalIdentity: '全栈开发者',
        ratingAvg: 4.6,
        ratingCount: 20,
        skillTags: { connect: [{ id: skillByName.get('前端开发')!.id }, { id: skillByName.get('后端开发')!.id }] },
      },
    }),
    prisma.user.create({
      data: {
        phone: '13800000003',
        nickname: 'Sasa',
        professionalIdentity: '独立客户 / 初创团队创始人',
        ratingAvg: 4.9,
        ratingCount: 8,
      },
    }),
    prisma.user.create({
      data: {
        phone: '13800000004',
        nickname: '阿凯',
        professionalIdentity: '增长运营顾问',
        ratingAvg: 4.5,
        ratingCount: 15,
        skillTags: { connect: [{ id: skillByName.get('增长运营')!.id }] },
      },
    }),
  ]);
  const [devUser, clientUser, growthUser] = otherUsers;

  console.log('创建项目...');
  const projectSeeds = [
    {
      title: '独立开发者记账小程序',
      background: '客户是一名独立开发者，目前用 Excel 手工记录多个自由职业项目的收支，容易出错且无法按项目汇总。',
      goal: '交付一个微信小程序端的轻量记账工具，支持按项目/客户维度记账与月度汇总。',
      coreFeatures: '收支记录、按项目打标签、月度/项目维度汇总报表、数据导出',
      deliverables: '可发布的微信小程序 + 源代码 + 部署文档',
      acceptanceCriteria: '核心记账流程无阻塞性 Bug，报表数据与手工核算一致',
      budgetMin: 6000,
      budgetMax: 12000,
      cycleWeeks: 4,
      status: 'RECRUITING' as const,
      heat: 128,
      skills: ['小程序开发', '产品设计'],
      publisherId: clientUser.id,
      roles: [{ roleName: '小程序开发', headcount: 1 }],
      publishTier: 'BOUNTY' as const,
    },
    {
      title: 'AI 简历优化工具 MVP',
      background: '面向自由职业者和求职者，帮助用户用 AI 优化简历表达并匹配目标岗位关键词。',
      goal: '验证"上传简历 + AI 改写建议"的核心体验是否能提升用户转化率。',
      coreFeatures: 'AI 简历分析、改写建议、关键词匹配、导出优化版简历',
      deliverables: '可运行的 Web MVP + Prompt 设计文档',
      acceptanceCriteria: '完成 3 轮真实用户测试，核心链路无阻塞问题',
      budgetMin: 8000,
      budgetMax: 15000,
      cycleWeeks: 6,
      status: 'RECRUITING' as const,
      heat: 246,
      skills: ['AI工具', '前端开发', '产品设计'],
      publisherId: demoUser.id,
      roles: [{ roleName: '前端开发', headcount: 1 }, { roleName: 'AI Prompt 工程', headcount: 1 }],
      publishTier: 'BOOSTED' as const,
    },
    {
      title: '独立咖啡品牌视觉与小程序改版',
      background: '一家精品咖啡独立品牌需要统一视觉语言，并优化小程序点单体验。',
      goal: '提升品牌辨识度与小程序下单转化率。',
      coreFeatures: '品牌视觉规范、小程序点单流程重构、会员积分模块',
      deliverables: '品牌视觉手册 + 小程序改版设计稿 + 高保真原型',
      acceptanceCriteria: '客户对视觉方向和核心流程验收通过',
      budgetMin: 10000,
      budgetMax: 18000,
      cycleWeeks: 5,
      status: 'IN_PROGRESS' as const,
      heat: 96,
      skills: ['品牌设计', 'UI设计'],
      publisherId: clientUser.id,
      roles: [{ roleName: 'UI设计', headcount: 1 }],
      members: [demoUser.id],
    },
    {
      title: '独立开发者作品集网站增长优化',
      background: '一名独立开发者的个人作品集网站流量不错但转化率低，希望优化落地页与获客路径。',
      goal: '在 3 周内将访客转化为咨询/合作线索的比例提升。',
      coreFeatures: '落地页 A/B 测试、获客路径梳理、转化数据看板',
      deliverables: '优化后的落地页 + 数据复盘报告',
      acceptanceCriteria: '转化率相比基线有可衡量提升，并附数据支撑',
      budgetMin: 4000,
      budgetMax: 7000,
      cycleWeeks: 3,
      status: 'PENDING_CONFIRM' as const,
      heat: 54,
      skills: ['增长运营', '数据分析'],
      publisherId: demoUser.id,
      roles: [{ roleName: '增长运营', headcount: 1 }],
      members: [growthUser.id],
    },
    {
      title: '自由职业者协作工具后台重构',
      background: '早期版本技术债较重，需要重构后台服务以支撑更多并发用户。',
      goal: '完成核心服务的技术重构并平滑上线。',
      coreFeatures: '服务拆分、数据库优化、灰度发布方案',
      deliverables: '重构后的后台代码 + 上线复盘文档',
      acceptanceCriteria: '重构后核心接口响应时间下降，且无功能回归',
      budgetMin: 15000,
      budgetMax: 25000,
      cycleWeeks: 8,
      status: 'COMPLETED' as const,
      heat: 180,
      skills: ['后端开发', '数据分析'],
      publisherId: clientUser.id,
      roles: [{ roleName: '后端开发', headcount: 1 }],
      members: [devUser.id],
    },
    {
      title: '独立顾问个人品牌小站（已归档）',
      background: '一位独立咨询顾问希望上线一个展示案例与预约咨询的小站。',
      goal: '快速上线一个可预约、可展示案例的个人品牌网站。',
      coreFeatures: '案例展示、在线预约、联系表单',
      deliverables: '上线的静态网站',
      acceptanceCriteria: '网站可正常访问且预约流程通畅',
      budgetMin: 3000,
      budgetMax: 5000,
      cycleWeeks: 2,
      status: 'ARCHIVED' as const,
      heat: 12,
      skills: ['前端开发', '品牌设计'],
      publisherId: clientUser.id,
      roles: [],
      members: [devUser.id],
    },
    {
      title: '全栈开发者可接小程序与 Web MVP',
      background: '独立全栈开发者，本月有 40 小时档期，擅长业务工具、数据看板、AI 应用前端集成。',
      goal: '寻找合适的短期协作项目，主动展示可承接的技术能力范围（对应 Figma"供给"类型卡片）。',
      coreFeatures: '小程序开发、Web MVP 搭建、数据看板、AI 应用前端集成',
      deliverables: '按项目约定交付，可提供过往案例包',
      acceptanceCriteria: '按约定验收标准交付',
      budgetMin: 3000,
      budgetMax: 10000,
      cycleWeeks: 2,
      status: 'RECRUITING' as const,
      heat: 40,
      skills: ['小程序开发', '前端开发'],
      publisherId: devUser.id,
      roles: [],
      kind: 'SUPPLY' as const,
    },
  ];

  const createdProjects: Project[] = [];
  for (const seed of projectSeeds) {
    const project = await prisma.project.create({
      data: {
        title: seed.title,
        background: seed.background,
        goal: seed.goal,
        coreFeatures: seed.coreFeatures,
        deliverables: seed.deliverables,
        acceptanceCriteria: seed.acceptanceCriteria,
        budgetMin: seed.budgetMin,
        budgetMax: seed.budgetMax,
        cycleWeeks: seed.cycleWeeks,
        status: seed.status,
        heat: seed.heat,
        kind: seed.kind ?? 'DEMAND',
        publishTier: seed.publishTier ?? 'STANDARD',
        publisherId: seed.publisherId,
        skillTags: { connect: seed.skills.map((name) => ({ id: skillByName.get(name)!.id })) },
        roles: {
          create: seed.roles.map((role) => ({
            roleName: role.roleName,
            headcount: role.headcount,
            requiredSkills: { connect: seed.skills.map((name) => ({ id: skillByName.get(name)!.id })) },
          })),
        },
      },
    });

    if (seed.members?.length) {
      await Promise.all(
        seed.members.map((userId) =>
          prisma.projectMember.create({ data: { projectId: project.id, userId, role: '协作者' } }),
        ),
      );

      await prisma.task.createMany({
        data: [
          { projectId: project.id, title: '确认需求范围', assigneeId: seed.members[0], status: 'DONE' },
          { projectId: project.id, title: '完成核心功能开发', assigneeId: seed.members[0], status: 'IN_PROGRESS', dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000), aiGenerated: true },
          { projectId: project.id, title: '整理交付文档', assigneeId: seed.members[0], status: 'TODO', dueDate: new Date(Date.now() + 10 * 24 * 3600 * 1000), aiGenerated: true },
        ],
      });
    }

    createdProjects.push(project);
  }

  console.log('创建会话与消息...');
  const projectConversation = await prisma.conversation.create({
    data: {
      type: 'PROJECT',
      projectId: createdProjects[2].id,
      title: '独立咖啡品牌视觉与小程序改版 · 项目群',
      lastMessageAt: new Date(),
      participants: {
        create: [
          { userId: demoUser.id, unreadCount: 2 },
          { userId: clientUser.id, unreadCount: 0 },
        ],
      },
    },
  });

  const message1 = await prisma.chatMessage.create({
    data: {
      conversationId: projectConversation.id,
      senderId: clientUser.id,
      content: '视觉稿我看了，整体方向没问题，麻烦周五前给到点单流程的高保真原型',
    },
  });
  await prisma.chatMessage.create({
    data: {
      conversationId: projectConversation.id,
      senderId: demoUser.id,
      content: '好的，另外会员积分模块的规则想再确认一下，是按消费金额还是按次数计分？',
    },
  });

  await prisma.conversation.create({
    data: {
      type: 'SYSTEM',
      title: '系统通知',
      lastMessageAt: new Date(Date.now() - 2 * 3600 * 1000),
      participants: { create: [{ userId: demoUser.id, unreadCount: 1 }] },
      messages: { create: [{ senderId: demoUser.id, content: '你的项目「AI 简历优化工具 MVP」已成功发布' }] },
    },
  });

  await prisma.conversation.create({
    data: {
      type: 'APPLICATION',
      title: '林工申请加入「AI 简历优化工具 MVP」',
      lastMessageAt: new Date(Date.now() - 20 * 60 * 1000),
      participants: { create: [{ userId: demoUser.id, unreadCount: 1 }] },
      messages: { create: [{ senderId: devUser.id, content: '我之前做过类似的 AI 工具产品，希望能加入前端开发角色' }] },
    },
  });

  console.log('创建培风社官方频道（对应 11/14 号画板：频道浏览、休息室语音房）...');
  const channelSeeds = [
    { title: '公告', category: '公告' },
    { title: 'welcome-and-rules', category: '公告' },
    { title: '活动直播间', category: '社区' },
    { title: '休息室', category: '社区', isVoiceRoom: true },
    { title: 'Discuss', category: '社区' },
    { title: '项目群聊', category: '协作' },
    { title: '任务协作', category: '协作' },
    { title: '资源交换', category: '协作' },
  ];
  const channels = await Promise.all(
    channelSeeds.map((c) =>
      prisma.conversation.create({
        data: {
          type: 'CHANNEL',
          title: c.title,
          category: c.category,
          isVoiceRoom: c.isVoiceRoom ?? false,
          lastMessageAt: new Date(),
        },
      }),
    ),
  );
  const channelByTitle = new Map(channels.map((c) => [c.title, c]));

  // demoUser 已加入公告 / Discuss / 资源交换三个频道，其余频道要靠"频道浏览"页面自己加入
  await prisma.conversationParticipant.createMany({
    data: [
      { conversationId: channelByTitle.get('公告')!.id, userId: demoUser.id, unreadCount: 2 },
      { conversationId: channelByTitle.get('Discuss')!.id, userId: demoUser.id, unreadCount: 0 },
      { conversationId: channelByTitle.get('资源交换')!.id, userId: demoUser.id, unreadCount: 1 },
    ],
  });

  await prisma.chatMessage.createMany({
    data: [
      {
        conversationId: channelByTitle.get('公告')!.id,
        senderId: growthUser.id,
        content: '本周社区分享会周五 20:00 线上举行，主题是"独立开发者的定价策略"，欢迎报名。',
      },
      {
        conversationId: channelByTitle.get('Discuss')!.id,
        senderId: devUser.id,
        content: '有没有人研究过小程序端语音输入的最佳实践？想交流一下方案。',
      },
      {
        conversationId: channelByTitle.get('资源交换')!.id,
        senderId: clientUser.id,
        content: '有 Figma 专业版多余席位，需要的可以来换 3 个月 Notion 会员。',
      },
    ],
  });

  console.log('创建待办事项（模拟 AI 从聊天中提取）...');
  await prisma.todo.createMany({
    data: [
      {
        userId: demoUser.id,
        conversationId: projectConversation.id,
        sourceMessageId: message1.id,
        content: '周五前提供点单流程高保真原型',
        assignee: '陈小舟',
        dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000),
        aiExtracted: true,
        confirmedByUser: false,
      },
      {
        userId: demoUser.id,
        content: '确认「AI 简历优化工具 MVP」预算区间是否需要调整',
        aiExtracted: false,
        confirmedByUser: true,
      },
    ],
  });

  console.log('创建知识库沉淀与作品集示例...');
  await prisma.knowledgeEntry.create({
    data: {
      userId: demoUser.id,
      projectId: createdProjects[4].id,
      summary: '本次重构验证了"先梳理服务边界再拆分"的路径比一次性重写风险更低。',
      lessonsLearned: '灰度发布方案提前和客户对齐验收标准，减少了后期返工。',
      aiGenerated: true,
      editedByUser: true,
    },
  });

  await prisma.portfolio.create({
    data: {
      userId: demoUser.id,
      projectRefId: createdProjects[2].id,
      title: '独立咖啡品牌视觉与小程序改版',
      description: '负责信息架构梳理与点单流程重构，转化率提升明显。',
      aiGenerated: true,
    },
  });

  await prisma.portfolio.create({
    data: {
      userId: devUser.id,
      projectRefId: createdProjects[4].id,
      title: '自由职业者协作工具后台重构',
      description: '负责服务拆分与数据库优化，重构后核心接口响应时间明显下降。',
      aiGenerated: false,
    },
  });

  console.log('Seed 完成');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
