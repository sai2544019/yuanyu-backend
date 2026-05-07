/**
 * 内存数据库 — MVP阶段使用Map存储
 * 生产环境替换为 Prisma + PostgreSQL
 */
import { v4 as uuidv4 } from 'uuid';
import type {
  User, UserPublic, UserQuestion, SwipeRecord, Match,
  Conversation, Message, Community, CommunityMember,
  Activity, Gender, SwipeAction, VerificationType
} from '../types';

// 模拟数据存储
const db = {
  users: new Map<string, User & { photos: string[]; interests: string[] }>(),
  swipeRecords: [] as SwipeRecord[],
  matches: new Map<string, Match>(),
  conversations: new Map<string, Conversation>(),
  messages: new Map<string, Message>(),
  communities: new Map<string, Community>(),
  communityMembers: new Map<string, CommunityMember>(),
  activities: new Map<string, Activity>(),
  questions: new Map<string, UserQuestion>(),
  verificationCodes: new Map<string, { code: string; expiresAt: number }>(),
  blockedUsers: new Map<string, Set<string>>(),
};

// 初始化种子数据
function seedData() {
  const cities = ['深圳', '北京', '上海', '广州', '杭州'];
  const districts = ['南山区', '海淀区', '浦东新区', '天河区', '西湖区'];
  const interests = ['跑步', '健身', '游泳', '篮球', '羽毛球', '咖啡', '后摇', '阅读', '美食', '摄影', '旅行', '烹饪', '冥想', '写作', '瑜伽'];

  const bios = [
    '周末有空一起跑步吗？或者去咖啡馆待着也挺好的。',
    '深圳互联网打工人，喜欢摄影和旅行，想认识有趣的人。',
    '安静的时光里，喜欢一个人看书和喝咖啡。',
    '运动是我的生活方式，羽毛球和游泳都在行。',
    '寻找那个一起看日落的人。',
    '前端工程师，业余时间喜欢弹吉他，希望遇到志同道合的朋友。',
    '喜欢探索城市里的小众咖啡馆，有推荐的请告诉我～',
    '认真生活的人，希望能在这里遇到认真的你。',
  ];

  const names = [
    '林小北', '陈阿花', '张小明', '刘大壮', '王小米',
    '李静怡', '周子轩', '吴雨晴', '郑海峰', '孙梦琪',
    '赵文博', '钱思远', '杨晓晨', '黄志远', '徐安然',
  ];

  // 创建15个种子用户
  for (let i = 0; i < 15; i++) {
    const id = `user_${String(i + 1).padStart(3, '0')}`;
    const userInterests = interests.sort(() => Math.random() - 0.5).slice(0, 5 + Math.floor(Math.random() * 4));
    const gender: Gender = i % 3 === 0 ? 1 : i % 3 === 1 ? 2 : 3;
    const age = 22 + Math.floor(Math.random() * 18);

    const user: User & { photos: string[]; interests: string[] } = {
      id,
      phone: `138${String(i + 1).padStart(8, '0')}`,
      nickname: names[i],
      gender,
      birthday: `${2000 + Math.floor(Math.random() * 5)}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`,
      city: cities[i % cities.length],
      district: districts[i % districts.length],
      bio: bios[i % bios.length],
      avatarUrl: `https://i.pravatar.cc/200?u=${id}`,
      latitude: 22.5 + Math.random() * 0.3,
      longitude: 113.9 + Math.random() * 0.3,
      isVerified: i < 10,
      vipStatus: i < 3 ? 3 : 0,
      isOnline: Math.random() > 0.4,
      lastActiveAt: new Date(Date.now() - Math.random() * 7 * 24 * 3600 * 1000).toISOString(),
      isDeleted: false,
      dailySwipeLimit: 50,
      dailySwipeUsed: Math.floor(Math.random() * 20),
      createdAt: new Date(Date.now() - (30 + Math.floor(Math.random() * 60)) * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      photos: Array.from({ length: 3 + Math.floor(Math.random() * 3) }, (_, j) =>
        `https://i.pravatar.cc/300?u=${id}_${j}`
      ),
      interests: userInterests,
    };

    db.users.set(id, user);

    // 为每个用户添加2-3个真心话
    const qas = [
      { q: '你最看重朋友的什么品质？', a: ['真诚吧，相处舒服最重要', '善良和幽默感', '有共同话题', '上进心和责任感'] },
      { q: '周末一般怎么过？', a: ['运动或户外活动', '宅家里看书充电', '和朋友聚会', '探索新餐厅'] },
      { q: '最近在读什么书？', a: ['《百年孤独》', '《原则》', '最近在刷剧', '技术书籍'] },
    ];

    const numQ = 2 + Math.floor(Math.random() * 2);
    for (let j = 0; j < numQ; j++) {
      const qa = qas[j];
      const q: UserQuestion = {
        id: uuidv4(),
        userId: id,
        question: qa.q,
        answer: qa.a[Math.floor(Math.random() * qa.a.length)],
        isPublic: true,
        sortOrder: j,
      };
      db.questions.set(q.id, q);
    }
  }

  // 创建3个种子社群
  const seedCommunities: Omit<Community, 'createdAt'>[] = [
    {
      id: 'comm_001',
      name: '深圳羽毛球周末局',
      description: '每周六下午，南山羽毛球馆见！无论你是新手还是高手，只要热爱运动，欢迎加入~',
      coverUrl: 'https://picsum.photos/seed/badminton/400/200',
      category: '运动',
      city: '深圳',
      type: 1,
      ownerId: 'user_001',
      memberCount: 328,
      maxMembers: 500,
      isActive: true,
    },
    {
      id: 'comm_002',
      name: '后摇乐迷交流群',
      description: '分享你的私藏后摇歌单，聊一聊那些让人沉醉的旋律',
      coverUrl: 'https://picsum.photos/seed/music/400/200',
      category: '音乐',
      city: '全国',
      type: 1,
      ownerId: 'user_002',
      memberCount: 156,
      maxMembers: 300,
      isActive: true,
    },
    {
      id: 'comm_003',
      name: '深圳户外徒步探索',
      description: '梧桐山、马峦山、七娘山...深圳周边的每一条徒步路线我们都走过',
      coverUrl: 'https://picsum.photos/seed/hiking/400/200',
      category: '户外',
      city: '深圳',
      type: 1,
      ownerId: 'user_003',
      memberCount: 567,
      maxMembers: 800,
      isActive: true,
    },
  ];

  seedCommunities.forEach(c => {
    db.communities.set(c.id, { ...c, createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString() });
    // 随机用户加入社群
    for (let i = 1; i <= 15; i++) {
      if (Math.random() > 0.3) {
        db.communityMembers.set(`${c.id}_user_${String(i).padStart(3, '0')}`, {
          id: uuidv4(),
          communityId: c.id,
          userId: `user_${String(i).padStart(3, '0')}`,
          role: i === 1 ? 2 : 1,
          status: 1,
          joinedAt: new Date(Date.now() - Math.random() * 20 * 24 * 3600 * 1000).toISOString(),
        });
      }
    }
  });

  // 创建匹配记录
  const matchPairs = [
    ['user_001', 'user_002'], ['user_003', 'user_004'],
    ['user_005', 'user_006'], ['user_007', 'user_008'],
  ];
  matchPairs.forEach(([a, b], i) => {
    db.matches.set(`${a}_${b}`, {
      id: `match_${String(i + 1).padStart(3, '0')}`,
      userAId: a, userBId: b,
      matchType: 1,
      createdAt: new Date(Date.now() - (5 + i * 2) * 24 * 3600 * 1000).toISOString(),
    });
    // 创建会话
    db.conversations.set(`conv_${i + 1}`, {
      id: `conv_${i + 1}`,
      type: 1,
      targetId: a,
      lastMessageAt: new Date(Date.now() - Math.random() * 3600 * 1000).toISOString(),
      createdAt: new Date(Date.now() - (5 + i) * 24 * 3600 * 1000).toISOString(),
    });
  });

  console.log(`✅ 种子数据初始化完成: ${db.users.size}用户, ${db.communities.size}社群, ${db.matches.size}匹配`);
}

seedData();

export default db;
