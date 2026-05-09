import jwt from 'jsonwebtoken';
import prisma from '../db/prisma';
import { config } from '../config';
import type { UserPublic, Gender, UserQuestion as UQ } from '../types';

function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export class UserService {
  private generateToken(userId: string): string {
    return jwt.sign({ userId }, config.jwt.secret, {
      expiresIn: config.jwt.accessExpiresIn,
    });
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign({ userId, type: 'refresh' }, config.jwt.secret, {
      expiresIn: config.jwt.refreshExpiresIn,
    });
  }

  // ========== 认证 ==========

  async register(nickname: string) {
    const existing = await prisma.user.findFirst({
      where: { nickname, isDeleted: false },
    });
    if (existing) {
      return this.loginByNickname(nickname);
    }

    const user = await prisma.user.create({
      data: {
        nickname,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(nickname)}&background=FF6B6B&color=fff&size=200`,
        photos: JSON.stringify([]),
        interests: JSON.stringify([]),
      },
    });

    const token = this.generateToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);
    return { user, token, refreshToken, isNew: true };
  }

  async loginByNickname(nickname: string) {
    const user = await prisma.user.findFirst({
      where: { nickname, isDeleted: false },
    });
    if (!user) throw new Error('用户不存在，请先注册');

    await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true, lastActiveAt: new Date() },
    });

    const token = this.generateToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);
    return { user, token, refreshToken };
  }

  async refreshToken(refreshToken: string) {
    const payload = jwt.verify(refreshToken, config.jwt.secret) as { userId: string; type?: string };
    if (payload.type !== 'refresh') throw new Error('无效的刷新令牌');
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.isDeleted) throw new Error('用户不存在');
    return {
      token: this.generateToken(user.id),
      refreshToken: this.generateRefreshToken(user.id),
    };
  }

  // ========== 用户资料 ==========

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.isDeleted) return null;
    return {
      ...user,
      photos: JSON.parse(user.photos || '[]') as string[],
      interests: JSON.parse(user.interests || '[]') as string[],
    };
  }

  async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.isDeleted) return null;
    return this.toPublicUser(user);
  }

  async updateProfile(userId: string, data: {
    nickname?: string; gender?: Gender; birthday?: string;
    city?: string; district?: string; bio?: string; avatarUrl?: string;
  }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('用户不存在');

    return prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.nickname !== undefined && { nickname: data.nickname }),
        ...(data.gender !== undefined && { gender: data.gender }),
        ...(data.birthday !== undefined && { birthday: new Date(data.birthday) }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.district !== undefined && { district: data.district }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      },
    });
  }

  async updateLocation(userId: string, latitude: number, longitude: number) {
    await prisma.user.update({
      where: { id: userId },
      data: { latitude, longitude, lastActiveAt: new Date() },
    });
  }

  async updateInterests(userId: string, interests: string[]) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { interests: JSON.stringify(interests.slice(0, 15)) },
    });
    return JSON.parse(user.interests || '[]') as string[];
  }

  // ========== 真心话 ==========

  async getQuestions(userId: string): Promise<UQ[]> {
    const qs = await prisma.userQuestion.findMany({
      where: { userId },
      orderBy: { sortOrder: 'asc' },
    });
    return qs;
  }

  async updateQuestion(userId: string, questionId: string, answer: string): Promise<UQ> {
    const q = await prisma.userQuestion.findUnique({ where: { id: questionId } });
    if (!q || q.userId !== userId) throw new Error('问题不存在');
    return prisma.userQuestion.update({
      where: { id: questionId },
      data: { answer },
    });
  }

  async addQuestion(userId: string, question: string, answer: string): Promise<UQ> {
    const count = await prisma.userQuestion.count({ where: { userId } });
    if (count >= 10) throw new Error('最多添加10个问题');
    return prisma.userQuestion.create({
      data: { userId, question, answer, sortOrder: count },
    });
  }

  async deleteQuestion(userId: string, questionId: string): Promise<void> {
    const q = await prisma.userQuestion.findUnique({ where: { id: questionId } });
    if (!q || q.userId !== userId) throw new Error('问题不存在');
    await prisma.userQuestion.delete({ where: { id: questionId } });
  }

  // ========== 发现页推荐 ==========

  async getDiscoverFeed(userId: string, preferGender: Gender, page = 1, pageSize = 20) {
    const swipedIds = await prisma.swipeRecord.findMany({
      where: { swiperId: userId },
      select: { swipedId: true },
    });
    const swipedSet = new Set(swipedIds.map(r => r.swipedId));

    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        isDeleted: false,
        gender: preferGender === 3 ? undefined : preferGender,
        photos: { not: '[]' },
      },
      orderBy: { isOnline: 'desc' },
    });

    const photosSet = new Set<string>();
    for (const u of users) {
      const p = JSON.parse(u.photos || '[]') as string[];
      if (p.length > 0) photosSet.add(u.id);
    }

    const candidates = users
      .filter(u => !swipedSet.has(u.id) && photosSet.has(u.id))
      .map(u => this.toPublicUser(u))
      .slice((page - 1) * pageSize, page * pageSize);

    return candidates;
  }

  // ========== 附近的人 ==========

  async getNearby(userId: string, _category?: string, page = 1, pageSize = 20) {
    const me = await prisma.user.findUnique({ where: { id: userId } });
    if (!me || me.latitude === null || me.longitude === null) return [];

    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        isDeleted: false,
        latitude: { not: null },
        longitude: { not: null },
      },
    });

    const candidates = users
      .map(u => {
        const dist = calcDistance(me.latitude!, me.longitude!, u.latitude!, u.longitude!);
        const pub = this.toPublicUser(u);
        pub.distance = dist;
        return pub;
      })
      .filter(u => u.distance !== undefined && u.distance <= 50)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice((page - 1) * pageSize, page * pageSize);

    return candidates;
  }

  // ========== 辅助方法 ==========

  private toPublicUser(user: {
    id: string; nickname: string; gender: Gender; birthday: Date | null;
    city: string | null; district: string | null; bio: string | null;
    avatarUrl: string | null; isOnline: boolean; isVerified: boolean;
    photos: string; interests: string;
  }): UserPublic {
    const photos = JSON.parse(user.photos || '[]') as string[];
    const interests = JSON.parse(user.interests || '[]') as string[];
    const age = user.birthday
      ? Math.floor((Date.now() - user.birthday.getTime()) / (365.25 * 24 * 3600 * 1000))
      : undefined;

    return {
      id: user.id,
      nickname: user.nickname,
      gender: user.gender,
      age,
      city: user.city || undefined,
      district: user.district || undefined,
      bio: user.bio || undefined,
      avatarUrl: photos[0] || user.avatarUrl || undefined,
      isOnline: user.isOnline,
      isVerified: user.isVerified,
      interests,
    };
  }
}

export const userService = new UserService();
