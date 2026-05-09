import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 真实感用户画像
const USERS = [
  {
    nickname: '林小北',
    gender: 2 as const,
    city: '深圳', district: '南山区',
    bio: '互联网产品经理，周末喜欢探索新店和户外徒步🏔️ 咖啡重度爱好者，手冲壶已经用了三年',
    avatar: 'https://i.pravatar.cc/200?img=47',
    photos: ['https://i.pravatar.cc/400?img=47', 'https://i.pravatar.cc/400?img=48', 'https://i.pravatar.cc/400?img=49'],
    interests: ['咖啡', '徒步', '摄影', '美食探店'],
    questions: [
      { q: '理想的周末？', a: '睡到自然醒，去一家收藏已久的咖啡店，下午去海边走走' },
      { q: '最近在追什么？', a: '《我的阿勒泰》，想去新疆很久了' },
      { q: '你的MBTI', a: 'INTJ — 计划狂魔，但偶尔也会冲动' },
    ],
  },
  {
    nickname: '陈思雨',
    gender: 2 as const,
    city: '上海', district: '静安区',
    bio: '独立设计师，热爱艺术展和独立电影🎬 相信生活的仪式感藏在细节里',
    avatar: 'https://i.pravatar.cc/200?img=44',
    photos: ['https://i.pravatar.cc/400?img=44', 'https://i.pravatar.cc/400?img=45', 'https://i.pravatar.cc/400?img=46'],
    interests: ['艺术展', '独立电影', '古典乐', '设计'],
    questions: [
      { q: '最近看的一部电影', a: '《坠落的审判》— 把亲密关系剖析得很彻底，看完和闺蜜聊到凌晨三点' },
      { q: '理想的约会', a: '一起看展，然后找个安静的餐厅聊天，不要太吵的那种' },
    ],
  },
  {
    nickname: '王子健',
    gender: 1 as const,
    city: '北京', district: '朝阳区',
    bio: '程序员，但热爱生活的程序员 🚴‍♂️ 业余公路车手，周末在京郊骑行，也在学吉他',
    avatar: 'https://i.pravatar.cc/200?img=51',
    photos: ['https://i.pravatar.cc/400?img=51', 'https://i.pravatar.cc/400?img=52', 'https://i.pravatar.cc/400?img=53'],
    interests: ['骑行', '吉他', '跑步', '摇滚乐'],
    questions: [
      { q: '最近在追什么？', a: '《繁花》— 马伊琍太有魅力了' },
      { q: 'MBTI', a: 'ENFP — 永远对世界充满好奇' },
      { q: '理想的约会', a: '骑车去一个没去过的地方，找一家有特色的咖啡店待一下午' },
    ],
  },
  {
    nickname: '李梦琪',
    gender: 2 as const,
    city: '杭州', district: '西湖区',
    bio: '自由摄影师📷 相信镜头能捕捉到生活的诗意。喜欢有质感的小众旅行目的地',
    avatar: 'https://i.pravatar.cc/200?img=41',
    photos: ['https://i.pravatar.cc/400?img=41', 'https://i.pravatar.cc/400?img=42', 'https://i.pravatar.cc/400?img=43'],
    interests: ['摄影', '旅行', '阅读', '民谣'],
    questions: [
      { q: '最近去了哪里', a: '上个月去了泉州，在西街住了一周，每天早起拍寺庙的光影' },
      { q: '你相信缘分吗', a: '相信，但也要自己走出去才能遇到' },
    ],
  },
  {
    nickname: '赵浩然',
    gender: 1 as const,
    city: '成都', district: '高新区',
    bio: '创业中，做消费品牌 🧃 美食爱好者，喜欢研究各种食材的搭配，工作之余坚持长跑',
    avatar: 'https://i.pravatar.cc/200?img=57',
    photos: ['https://i.pravatar.cc/400?img=57', 'https://i.pravatar.cc/400?img=58', 'https://i.pravatar.cc/400?img=59'],
    interests: ['跑步', '美食', '创业', '足球'],
    questions: [
      { q: '周末一般怎么过', a: '早上跑步，下午去菜市场研究新食材，晚上可能加班但心里踏实' },
      { q: '你最近最开心的事', a: '品牌的第一批用户反馈超出了预期！' },
    ],
  },
  {
    nickname: '周子墨',
    gender: 2 as const,
    city: '广州', district: '天河区',
    bio: '健身教练 & 营养师 💪 相信自律带来自由。业余时间在学日语，希望能去日本跑马拉松',
    avatar: 'https://i.pravatar.cc/200?img=40',
    photos: ['https://i.pravatar.cc/400?img=40', 'https://i.pravatar.cc/400?img=48', 'https://i.pravatar.cc/400?img=56'],
    interests: ['健身', '跑步', '日语', '营养学'],
    questions: [
      { q: '你的MBTI', a: 'ESTJ — 做事有规划，但也不排斥惊喜' },
      { q: '理想的约会', a: '一起运动，然后去吃一顿健康又美味的饭' },
    ],
  },
  {
    nickname: '吴思瑶',
    gender: 2 as const,
    city: '成都', district: '锦江区',
    bio: '新媒体编辑，追星但有底线🎤 喜欢独立乐队，也爱传统戏曲，偶尔写诗',
    avatar: 'https://i.pravatar.cc/200?img=39',
    photos: ['https://i.pravatar.cc/400?img=39', 'https://i.pravatar.cc/400?img=50', 'https://i.pravatar.cc/400?img=55'],
    interests: ['独立乐队', '戏曲', '诗歌', '写作'],
    questions: [
      { q: '最近在追什么', a: '新裤子的新专辑，live看了三遍' },
      { q: '你有什么独特的小爱好', a: '收集livehouse的票根，已经攒了一抽屉' },
    ],
  },
  {
    nickname: '郑天宇',
    gender: 1 as const,
    city: '深圳', district: '福田区',
    bio: '金融分析师，P人努力学做J人 📊 喜欢滑雪和威士忌，每年会安排一次出国旅行',
    avatar: 'https://i.pravatar.cc/200?img=53',
    photos: ['https://i.pravatar.cc/400?img=53', 'https://i.pravatar.cc/400?img=54', 'https://i.pravatar.cc/400?img=60'],
    interests: ['滑雪', '威士忌', '投资', '旅行'],
    questions: [
      { q: '中了彩票会怎么花', a: '辞职去旅行一年，从欧洲走到南美' },
      { q: '你不能接受的', a: '不诚实和没有边界感' },
    ],
  },
  {
    nickname: '黄诗涵',
    gender: 2 as const,
    city: '上海', district: '徐汇区',
    bio: '心理咨询师，读过了太多别人的故事，更珍惜自己的当下 🌿 养了两只猫',
    avatar: 'https://i.pravatar.cc/200?img=45',
    photos: ['https://i.pravatar.cc/400?img=45', 'https://i.pravatar.cc/400?img=46', 'https://i.pravatar.cc/400?img=47'],
    interests: ['心理学', '撸猫', '园艺', '冥想'],
    questions: [
      { q: '理想的约会', a: '找个环境好的地方，认真聊天，而不是各刷各的手机' },
      { q: '你相信缘分吗', a: '相信，但缘分也是要自己走出去才能遇到的' },
    ],
  },
  {
    nickname: '杨帆',
    gender: 1 as const,
    city: '武汉', district: '洪山区',
    bio: '大学老师，教文学 🎓 喜欢安静的生活方式，业余时间在写小说',
    avatar: 'https://i.pravatar.cc/200?img=56',
    photos: ['https://i.pravatar.cc/400?img=56', 'https://i.pravatar.cc/400?img=57', 'https://i.pravatar.cc/400?img=58'],
    interests: ['文学', '写作', '电影', '古典音乐'],
    questions: [
      { q: '最近在读什么', a: '重读《卡拉马佐夫兄弟》，每次读都有新的感受' },
      { q: '你有什么独特的小爱好', a: '收集书签，收到别人用过的书签会觉得特别浪漫' },
    ],
  },
  {
    nickname: '徐雅婷',
    gender: 2 as const,
    city: '杭州', district: '滨江区',
    bio: '互联网运营，策划过很多活动却懒得经营自己的社交 🤪 喜欢尝鲜，什么新东西都想试试',
    avatar: 'https://i.pravatar.cc/200?img=43',
    photos: ['https://i.pravatar.cc/400?img=43', 'https://i.pravatar.cc/400?img=44', 'https://i.pravatar.cc/400?img=49'],
    interests: ['桌游', '剧本杀', '美食', '脱口秀'],
    questions: [
      { q: 'MBTI', a: 'ENFP — 社交能力是天赋技能，但也很需要独处充电' },
      { q: '最近最开心的事', a: '抢到了我最喜欢的脱口秀演员的专场票！' },
    ],
  },
  {
    nickname: '孙浩然',
    gender: 1 as const,
    city: '南京', district: '玄武区',
    bio: '律师 but creative 🎸 乐队贝斯手，周末约球，也会去博物馆看展',
    avatar: 'https://i.pravatar.cc/200?img=59',
    photos: ['https://i.pravatar.cc/400?img=59', 'https://i.pravatar.cc/400?img=60', 'https://i.pravatar.cc/400?img=61'],
    interests: ['乐队', '足球', '法律', '博物馆'],
    questions: [
      { q: '理想的周末', a: '下午排练，晚上和队友找个小酒馆喝一杯聊聊天' },
      { q: '你不能接受的', a: '冷暴力和不上进' },
    ],
  },
  {
    nickname: '马晓晨',
    gender: 1 as const,
    city: '北京', district: '海淀区',
    bio: '建筑师，审美挑剔 🏛️ 喜欢有设计感的东西，也爱逛菜市场感受烟火气',
    avatar: 'https://i.pravatar.cc/200?img=60',
    photos: ['https://i.pravatar.cc/400?img=60', 'https://i.pravatar.cc/400?img=61', 'https://i.pravatar.cc/400?img=62'],
    interests: ['建筑', '设计', '摄影', '美食'],
    questions: [
      { q: '最近在追什么', a: '《设计中的设计》— 重新思考什么是好的设计' },
      { q: '中了彩票会怎么花', a: '环游世界看建筑，去看安藤忠雄设计的每一个建筑' },
    ],
  },
  {
    nickname: '陈雨晴',
    gender: 2 as const,
    city: '深圳', district: '南山区',
    bio: '护士 but 内心文艺 🌙 喜欢汉服和古风音乐，也在学钢琴，享受从零开始学的感觉',
    avatar: 'https://i.pravatar.cc/200?img=46',
    photos: ['https://i.pravatar.cc/400?img=46', 'https://i.pravatar.cc/400?img=50', 'https://i.pravatar.cc/400?img=51'],
    interests: ['汉服', '古风', '钢琴', '阅读'],
    questions: [
      { q: '你的MBTI', a: 'INFP — 内心世界很丰富，需要很多独处时间' },
      { q: '理想的约会', a: '穿汉服去古镇拍照，然后一起喝茶聊天' },
    ],
  },
  {
    nickname: '张铭',
    gender: 1 as const,
    city: '上海', district: '浦东新区',
    bio: '健身博主转型创业者 🏋️ 相信坚持的力量，分享健身日常也收获了很多同路人',
    avatar: 'https://i.pravatar.cc/200?img=52',
    photos: ['https://i.pravatar.cc/400?img=52', 'https://i.pravatar.cc/400?img=53', 'https://i.pravatar.cc/400?img=54'],
    interests: ['健身', '篮球', '创业', '营养'],
    questions: [
      { q: '理想的约会', a: '一起去健身，然后吃一顿高蛋白低脂肪的健身餐' },
      { q: '你有什么独特的小爱好', a: '收藏运动手表，每块表都有特别的记忆' },
    ],
  },
];

const CONVERSATIONS = [
  // 林小北 (0) <-> 陈思雨 (1)
  [
    { senderIdx: 0, content: '嗨～看到你也喜欢咖啡，你平时喝手冲还是意式多呀？' },
    { senderIdx: 1, content: '手冲！意式总觉得太急了，我喜欢慢慢冲的过程' },
    { senderIdx: 0, content: '完全同意！我现在用的是V60，感觉豆子风味能完全释放出来' },
    { senderIdx: 1, content: 'V60我也超爱！你一般买哪家豆子？' },
    { senderIdx: 0, content: '最近在喝上海的M2M，还有一家深圳本土的叫隔壁的树皮，强烈推荐！' },
    { senderIdx: 1, content: '记下来了！下次去深圳一定去探店～' },
    { senderIdx: 0, content: '好呀，到时候带你！' },
  ],
  // 王子健 (2) <-> 李梦琪 (3)
  [
    { senderIdx: 2, content: '你好呀！看到你喜欢独立电影，有没有最近特别推荐的？' },
    { senderIdx: 3, content: '有！你看过《坠落的审判》吗？太震撼了，庭审那场戏看了三遍' },
    { senderIdx: 2, content: '看过！茹斯汀·特里耶真的很会拍亲密关系的复杂性' },
    { senderIdx: 3, content: '对对对！尤其是那场在车里的对话，太真实了，像照镜子一样' },
    { senderIdx: 2, content: '哈哈我懂！有时候觉得电影比生活还真实' },
    { senderIdx: 3, content: '确实。最近还在看《乘列车前行》，北野武的，慢节奏但很治愈' },
    { senderIdx: 2, content: '北野武我还没怎么看过，列入清单！' },
  ],
  // 赵浩然 (4) <-> 周子墨 (5)
  [
    { senderIdx: 4, content: '你好～看到你是健身教练，想请教一下，长跑和力量训练怎么平衡？' },
    { senderIdx: 5, content: '这个问题太好了！建议每周3-4次力量+2-3次跑步，力量优先' },
    { senderIdx: 4, content: '我现在是每天跑5公里，感觉有点过量了，膝盖偶尔会不舒服' },
    { senderIdx: 5, content: '可能是跑量大了，建议跑一休一，给关节恢复时间。另外要加强腿部力量训练' },
    { senderIdx: 4, content: '收到！力量训练我之前没怎么重视' },
    { senderIdx: 5, content: '深蹲和硬拉练起来，对跑步帮助特别大。有需要可以给你发个训练计划' },
    { senderIdx: 4, content: '太感谢了！加微信吧，我发你红包🧧' },
    { senderIdx: 5, content: '哈哈不用不用，一起进步～' },
  ],
  // 吴思瑶 (6) <-> 郑天宇 (7)
  [
    { senderIdx: 6, content: '嗨！看到你也喜欢滑雪，爱好相同诶～' },
    { senderIdx: 7, content: '是呀！你一般去哪滑？国内还是出国？' },
    { senderIdx: 6, content: '之前每年冬天去日本，北海道的粉雪太绝了！但今年打算试试新疆的可可托海' },
    { senderIdx: 7, content: '可可托海我去年去了，风景超美！而且雪质不比日本差' },
    { senderIdx: 6, content: '真的吗！那我今年就去这了。有攻略吗？' },
    { senderIdx: 7, content: '有！我可以给你写一份，包含住、滑、吃。顺便问问，你单板还是双板？' },
    { senderIdx: 6, content: '单板！还在练换刃阶段' },
    { senderIdx: 7, content: '同好！我也是单板，一起进步🏂' },
  ],
];

async function main() {
  console.log('🌱 Seeding database with realistic users...');

  // Clean
  await prisma.aiMessage.deleteMany();
  await prisma.aiConversation.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.userSurvey.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.match.deleteMany();
  await prisma.swipeRecord.deleteMany();
  await prisma.communityMember.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.blockedUser.deleteMany();
  await prisma.community.deleteMany();
  await prisma.userQuestion.deleteMany();
  await prisma.verificationCode.deleteMany();
  await prisma.user.deleteMany();

  // Seed users
  const users = [];
  for (let i = 0; i < USERS.length; i++) {
    const u = USERS[i];
    const birthYear = 1992 + Math.floor(Math.random() * 6);
    const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    const user = await prisma.user.create({
      data: {
        id: `user_${String(i + 1).padStart(3, '0')}`,
        phone: `138${String(i + 1).padStart(9, '0')}1`,
        nickname: u.nickname,
        gender: u.gender,
        birthday: new Date(`${birthYear}-${birthMonth}-${birthDay}`),
        city: u.city,
        district: u.district,
        bio: u.bio,
        avatarUrl: u.avatar,
        photos: JSON.stringify(u.photos),
        interests: JSON.stringify(u.interests),
        isVerified: i < 10,
        vipStatus: i < 3 ? 3 : 0,
        isOnline: i % 3 !== 0,
        dailySwipeLimit: 50,
        dailySwipeUsed: Math.floor(Math.random() * 15),
      },
    });
    users.push(user);

    // Questions
    for (let qi = 0; qi < u.questions.length; qi++) {
      const qq = u.questions[qi];
      await prisma.userQuestion.create({
        data: {
          userId: user.id,
          question: qq.q,
          answer: qq.a,
          isPublic: true,
          sortOrder: qi,
        },
      });
    }
  }

  // Seed communities
  const communities = [
    {
      name: '深圳咖啡探店小队',
      description: '专注发现深圳小众精品咖啡店，分享豆子知识和冲煮技巧，不定期组织探店活动',
      category: '美食',
      city: '深圳',
      cover: 'https://picsum.photos/seed/coffee/800/400',
      memberCount: 89,
    },
    {
      name: '周末户外徒步',
      description: '深圳周边徒步路线分享，梧桐山/七娘山/梅沙尖，适合喜欢自然的你',
      category: '运动',
      city: '深圳',
      cover: 'https://picsum.photos/seed/hiking/800/400',
      memberCount: 156,
    },
    {
      name: '独立电影放映室',
      description: '一起看独立电影、艺术片，看完一起讨论。坐标上海静安区',
      category: '文艺',
      city: '上海',
      cover: 'https://picsum.photos/seed/movie/800/400',
      memberCount: 64,
    },
  ];

  const seededCommunities = [];
  for (const c of communities) {
    const seeded = await prisma.community.create({
      data: {
        ownerId: users[0].id,
        name: c.name,
        description: c.description,
        coverUrl: c.cover,
        category: c.category,
        city: c.city,
        memberCount: c.memberCount,
      },
    });
    seededCommunities.push(seeded);
  }

  // Add members
  for (const comm of seededCommunities) {
    const memberCount = Math.floor(Math.random() * 6) + 4;
    const shuffled = [...users].sort(() => Math.random() - 0.5).slice(0, memberCount);
    for (const member of shuffled) {
      await prisma.communityMember.create({
        data: {
          communityId: comm.id,
          userId: member.id,
          role: member.id === comm.ownerId ? 2 : 0,
          status: 1,
        },
      });
    }
  }

  // Seed matches + conversations + messages
  for (const pair of CONVERSATIONS) {
    const senderA = users[pair[0].senderIdx];
    const senderB = users[pair[1].senderIdx];

    // Match
    const match = await prisma.match.create({
      data: {
        userAId: senderA.id,
        userBId: senderB.id,
        matchType: 1,
      },
    });

    // Conversation
    const conv = await prisma.conversation.create({
      data: {
        type: 1,
        userAId: senderA.id,
        userBId: senderB.id,
      },
    });

    // Messages
    for (const m of pair) {
      const sender = users[m.senderIdx];
      await prisma.message.create({
        data: {
          convId: conv.id,
          senderId: sender.id,
          type: 1,
          content: m.content,
          readAt: new Date(),
        },
      });
    }

    // Update conversation last message
    const lastMsg = pair[pair.length - 1];
    await prisma.conversation.update({
      where: { id: conv.id },
      data: {
        lastMessageId: lastMsg.senderIdx === 0 ? senderA.id : senderB.id,
        lastMessageAt: new Date(),
      },
    });
  }

  // Some random swipes (not matches)
  for (let i = 0; i < 20; i++) {
    const a = Math.floor(Math.random() * users.length);
    let b = Math.floor(Math.random() * users.length);
    while (b === a) b = Math.floor(Math.random() * users.length);
    await prisma.swipeRecord.create({
      data: {
        swiperId: users[a].id,
        swipedId: users[b].id,
        action: [1, 2, 2, 2, 2][Math.floor(Math.random() * 5)] as 1 | 2,
      },
    }).catch(() => {}); // ignore unique constraint
  }

  console.log(`✅ Seed complete:`);
  console.log(`   - ${users.length} users with rich profiles`);
  console.log(`   - ${seededCommunities.length} communities`);
  console.log(`   - ${CONVERSATIONS.length} matched conversations with realistic chat`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
