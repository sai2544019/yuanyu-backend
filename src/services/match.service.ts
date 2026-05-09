import prisma from '../db/prisma';

export class MatchService {
  // 滑动操作
  async swipe(swiperId: string, swipedId: string, action: number): Promise<{
    result: 'skipped' | 'liked' | 'matched';
    match?: { id: string; createdAt: Date; convId?: string };
  }> {
    if (swiperId === swipedId) throw new Error('不能滑动自己');

    // 检查是否已滑动过
    const existing = await prisma.swipeRecord.findUnique({
      where: { swiperId_swipedId: { swiperId, swipedId } },
    });
    if (existing) throw new Error('已经滑动过该用户');

    await prisma.swipeRecord.create({
      data: { swiperId, swipedId, action },
    });

    // 更新滑动计数
    await prisma.user.update({
      where: { id: swiperId },
      data: { dailySwipeUsed: { increment: 1 }, lastActiveAt: new Date() },
    });

    if (action === 1) {
      return { result: 'skipped' };
    }

    // 检查对方是否也喜欢我
    const reverseRecord = await prisma.swipeRecord.findUnique({
      where: { swiperId_swipedId: { swiperId: swipedId, swipedId: swiperId } },
    });
    if (!reverseRecord || reverseRecord.action === 1) {
      return { result: 'liked' };
    }

    // 双向喜欢 → 创建匹配 + 会话（事务）
    const match = await prisma.match.create({
      data: {
        userAId: swiperId,
        userBId: swipedId,
        matchType: (action === 3 && reverseRecord.action === 3) ? 2 : 1,
      },
    });

    // 同时创建会话
    const conv = await prisma.conversation.create({
      data: {
        type: 1,
        userAId: swiperId,
        userBId: swipedId,
      },
    });

    return {
      result: 'matched',
      match: { id: match.id, createdAt: match.createdAt, convId: conv.id },
    };
  }

  // 获取我的匹配列表
  async getMatches(userId: string) {
    const matches = await prisma.match.findMany({
      where: {
        unmatchedAt: null,
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        userA: {
          select: {
            id: true, nickname: true, avatarUrl: true, photos: true,
            isOnline: true, isVerified: true, interests: true, city: true,
          },
        },
        userB: {
          select: {
            id: true, nickname: true, avatarUrl: true, photos: true,
            isOnline: true, isVerified: true, interests: true, city: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const results = [];
    for (const m of matches) {
      const other = m.userAId === userId ? m.userB : m.userA;
      const photos = JSON.parse(other.photos || '[]') as string[];
      const interests = JSON.parse(other.interests || '[]') as string[];

      // 查找与对方的私聊会话
      const conv = await prisma.conversation.findFirst({
        where: {
          type: 1,
          OR: [
            { userAId: userId, userBId: other.id },
            { userAId: other.id, userBId: userId },
          ],
        },
        select: { id: true },
      });

      results.push({
        id: m.id,
        matchType: m.matchType,
        createdAt: m.createdAt,
        convId: conv?.id,
        user: {
          id: other.id,
          nickname: other.nickname,
          avatarUrl: photos[0] || other.avatarUrl,
          isOnline: other.isOnline,
          isVerified: other.isVerified,
          interests,
          city: other.city,
        },
      });
    }

    return results;
  }

  // 取消匹配
  async unmatch(userId: string, matchId: string): Promise<void> {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new Error('匹配不存在');
    if (match.userAId !== userId && match.userBId !== userId) throw new Error('无权限');
    await prisma.match.update({
      where: { id: matchId },
      data: { unmatchedAt: new Date() },
    });
  }

  // 拉黑用户
  async blockUser(userId: string, blockedId: string): Promise<void> {
    await prisma.blockedUser.upsert({
      where: { blockerId_blockedId: { blockerId: userId, blockedId } },
      create: { blockerId: userId, blockedId },
      update: {},
    });

    // 解除匹配
    await prisma.match.updateMany({
      where: {
        OR: [
          { userAId: userId, userBId: blockedId },
          { userAId: blockedId, userBId: userId },
        ],
      },
      data: { unmatchedAt: new Date() },
    });
  }

  // 举报用户
  reportUser(reporterId: string, reportedId: string, reason: string, description?: string): void {
    console.log(`🚨 举报: 举报人=${reporterId}, 被举报=${reportedId}, 原因=${reason}, 描述=${description}`);
  }
}

export const matchService = new MatchService();
