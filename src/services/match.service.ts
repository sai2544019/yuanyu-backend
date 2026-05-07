import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import type { SwipeRecord, Match, SwipeAction } from '../types';

export class MatchService {
  // 滑动操作
  swipe(swiperId: string, swipedId: string, action: SwipeAction): { result: 'skipped' | 'liked' | 'matched'; match?: Match } {
    if (swiperId === swipedId) throw new Error('不能滑动自己');

    // 检查是否已滑动过
    const existing = db.swipeRecords.find(r => r.swiperId === swiperId && r.swipedId === swipedId);
    if (existing) throw new Error('已经滑动过该用户');

    const record: SwipeRecord = {
      id: uuidv4(),
      swiperId,
      swipedId,
      action,
      createdAt: new Date().toISOString(),
    };
    db.swipeRecords.push(record);

    // 更新滑动计数
    const swiper = db.users.get(swiperId);
    if (swiper) {
      swiper.dailySwipeUsed++;
      swiper.lastActiveAt = new Date().toISOString();
    }

    if (action === 1) {
      return { result: 'skipped' };
    }

    // 检查对方是否也喜欢了我
    const reverseRecord = db.swipeRecords.find(r => r.swiperId === swipedId && r.swipedId === swiperId);
    if (!reverseRecord || reverseRecord.action === 1) {
      return { result: 'liked' };
    }

    // 双向喜欢 → 创建匹配！
    const [a, b] = [swiperId, swipedId].sort();
    const matchId = `match_${uuidv4().slice(0, 8)}`;
    const match: Match = {
      id: matchId,
      userAId: a,
      userBId: b,
      matchType: (action === 3 && reverseRecord.action === 3) ? 2 : 1,
      createdAt: new Date().toISOString(),
    };
    db.matches.set(`${a}_${b}`, match);

    // 创建会话
    const convId = `conv_${uuidv4().slice(0, 8)}`;
    db.conversations.set(convId, {
      id: convId,
      type: 1,
      targetId: swipedId,
      createdAt: new Date().toISOString(),
    });

    return { result: 'matched', match };
  }

  // 获取我的匹配列表
  getMatches(userId: string) {
    const results: Array<Match & { user: ReturnType<MatchService['getOtherUser']> }> = [];

    db.matches.forEach((match) => {
      if (match.unmatchedAt) return;
      const otherId = match.userAId === userId ? match.userBId : match.userAId;
      if (otherId !== userId) {
        const other = this.getOtherUser(otherId);
        if (other) results.push({ ...match, user: other });
      }
    });

    return results.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // 取消匹配
  unmatch(userId: string, matchId: string): void {
    const match = db.matches.get(matchId);
    if (!match) throw new Error('匹配不存在');
    if (match.userAId !== userId && match.userBId !== userId) throw new Error('无权限');

    match.unmatchedAt = new Date().toISOString();
  }

  // 拉黑用户
  blockUser(userId: string, blockedId: string): void {
    if (!db.blockedUsers.has(userId)) {
      db.blockedUsers.set(userId, new Set());
    }
    db.blockedUsers.get(userId)!.add(blockedId);

    // 解除匹配
    const [a, b] = [userId, blockedId].sort();
    const match = db.matches.get(`${a}_${b}`);
    if (match) match.unmatchedAt = new Date().toISOString();
  }

  // 举报用户
  reportUser(reporterId: string, reportedId: string, reason: string, description?: string): void {
    // MVP阶段仅记录到日志，生产应写入数据库
    console.log(`🚨 举报: 举报人=${reporterId}, 被举报=${reportedId}, 原因=${reason}, 描述=${description}`);
  }

  private getOtherUser(userId: string) {
    const user = db.users.get(userId);
    if (!user || user.isDeleted) return null;
    return {
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.photos[0] || user.avatarUrl,
      isOnline: user.isOnline,
      isVerified: user.isVerified,
      interests: user.interests,
      city: user.city,
    };
  }
}

export const matchService = new MatchService();
