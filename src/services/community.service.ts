import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import type { Community, CommunityMember, Activity } from '../types';

export class CommunityService {
  // 社群广场
  getCommunities(category?: string, city?: string, page = 1, pageSize = 20): Community[] {
    let communities = Array.from(db.communities.values()).filter(c => c.isActive);

    if (category) {
      communities = communities.filter(c => c.category === category);
    }
    if (city) {
      communities = communities.filter(c => c.city === city || c.city === '全国');
    }

    return communities
      .sort((a, b) => b.memberCount - a.memberCount)
      .slice((page - 1) * pageSize, page * pageSize);
  }

  // 社群详情
  getCommunity(communityId: string): Community & { onlineCount: number } | null {
    const community = db.communities.get(communityId);
    if (!community) return null;

    const onlineCount = Array.from(db.communityMembers.values())
      .filter(m => m.communityId === communityId && m.status === 1)
      .filter(m => {
        const user = db.users.get(m.userId);
        return user?.isOnline;
      }).length;

    return { ...community, onlineCount };
  }

  // 创建社群
  createCommunity(userId: string, data: { name: string; description?: string; category: string; city?: string; type: 1 | 2 | 3 }): Community {
    const id = `comm_${uuidv4().slice(0, 8)}`;
    const community: Community = {
      id,
      name: data.name,
      description: data.description,
      category: data.category,
      city: data.city || '全国',
      type: data.type,
      ownerId: userId,
      memberCount: 1,
      maxMembers: 500,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    db.communities.set(id, community);

    // 创建者自动成为群主
    this.joinCommunity(id, userId, 2);
    return community;
  }

  // 加入社群
  joinCommunity(communityId: string, userId: string, role = 0): void {
    const community = db.communities.get(communityId);
    if (!community) throw new Error('社群不存在');

    const existing = db.communityMembers.get(`${communityId}_${userId}`);
    if (existing && existing.status === 1) throw new Error('已在社群中');

    if (existing) {
      existing.status = 1;
      existing.role = role as 0 | 1 | 2;
    } else {
      db.communityMembers.set(`${communityId}_${userId}`, {
        id: uuidv4(),
        communityId,
        userId,
        role: role as 0 | 1 | 2,
        status: 1,
        joinedAt: new Date().toISOString(),
      });
      community.memberCount++;
    }
  }

  // 退出社群
  leaveCommunity(communityId: string, userId: string): void {
    const member = db.communityMembers.get(`${communityId}_${userId}`);
    if (!member) throw new Error('不在社群中');

    member.status = 3;
    const community = db.communities.get(communityId);
    if (community) community.memberCount = Math.max(0, community.memberCount - 1);
  }

  // 成员列表
  getMembers(communityId: string, page = 1, pageSize = 50): Array<{ userId: string; nickname: string; avatarUrl?: string; role: number; isOnline: boolean }> {
    return Array.from(db.communityMembers.values())
      .filter(m => m.communityId === communityId && m.status === 1)
      .map(m => {
        const user = db.users.get(m.userId);
        return {
          userId: m.userId,
          nickname: user?.nickname || '未知用户',
          avatarUrl: user?.photos[0] || user?.avatarUrl,
          role: m.role,
          isOnline: user?.isOnline || false,
        };
      })
      .slice((page - 1) * pageSize, page * pageSize);
  }

  // 获取用户加入的社群
  getUserCommunities(userId: string): Community[] {
    const communityIds = Array.from(db.communityMembers.values())
      .filter(m => m.userId === userId && m.status === 1)
      .map(m => m.communityId);

    return communityIds
      .map(id => db.communities.get(id))
      .filter((c): c is Community => c !== undefined && c.isActive);
  }

  // ========== 活动 ==========

  // 活动列表
  getActivities(communityId: string, page = 1, pageSize = 20): Activity[] {
    return Array.from(db.activities.values())
      .filter(a => a.communityId === communityId && a.status !== 3)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice((page - 1) * pageSize, page * pageSize);
  }

  // 发布活动
  createActivity(userId: string, communityId: string, data: {
    title: string; description?: string; location: string;
    startTime: string; endTime: string; feeType: 0 | 1 | 2; feeAmount?: number;
    maxAttendees: number;
  }): Activity {
    const activity: Activity = {
      id: `act_${uuidv4().slice(0, 8)}`,
      communityId,
      creatorId: userId,
      title: data.title,
      description: data.description,
      location: data.location,
      startTime: data.startTime,
      endTime: data.endTime,
      feeType: data.feeType,
      feeAmount: data.feeAmount,
      maxAttendees: data.maxAttendees,
      curAttendees: 1,
      status: 0,
      createdAt: new Date().toISOString(),
    };
    db.activities.set(activity.id, activity);
    return activity;
  }

  // 活动详情
  getActivity(activityId: string): Activity | null {
    return db.activities.get(activityId) || null;
  }
}

export const communityService = new CommunityService();
