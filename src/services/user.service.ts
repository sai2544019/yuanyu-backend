import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from '../db';
import { config } from '../config';
import type { User, UserPublic, UserQuestion, JwtPayload, Gender, SwipeAction } from '../types';

export class UserService {
  // ========== 认证 ==========

  async sendCode(phone: string): Promise<{ code: string }> {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    db.verificationCodes.set(phone, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });
    console.log(`📱 验证码 ${code} 已发送到 ${phone} (开发环境)`);
    return { code };
  }

  async verifyCode(phone: string, code: string): Promise<{ user: User | null; isNew: boolean; token: string; refreshToken: string }> {
    const record = db.verificationCodes.get(phone);
    if (!record || record.code !== code || Date.now() > record.expiresAt) {
      throw new Error('验证码错误或已过期');
    }
    db.verificationCodes.delete(phone);

    let user = Array.from(db.users.values()).find(u => u.phone === phone && !u.isDeleted);
    const isNew = !user;

    if (!user) {
      user = {
        id: `user_${uuidv4().slice(0, 8)}`,
        phone,
        nickname: `用户${phone.slice(-4)}`,
        gender: 0 as Gender,
        isVerified: false,
        vipStatus: 0,
        isOnline: true,
        lastActiveAt: new Date().toISOString(),
        isDeleted: false,
        dailySwipeLimit: 50,
        dailySwipeUsed: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        photos: [],
        interests: [],
      };
      db.users.set(user.id, user);
    } else {
      user.isOnline = true;
      user.lastActiveAt = new Date().toISOString();
      user.updatedAt = new Date().toISOString();
    }

    const token = this.generateToken(user.id, user.phone);
    const refreshToken = this.generateRefreshToken(user.id);

    return { user, isNew, token, refreshToken };
  }

  private generateToken(userId: string, phone: string): string {
    return jwt.sign({ userId, phone } as JwtPayload, config.jwt.secret, {
      expiresIn: 900,
    });
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign({ userId, type: 'refresh' }, config.jwt.secret, {
      expiresIn: 2592000,
    });
  }

  // 一键注册（昵称已存在则登录）
  async register(nickname: string): Promise<{ user: User & { photos: string[]; interests: string[] }; token: string; refreshToken: string; isNew: boolean }> {
    // 先查是否已有该昵称的用户，有则直接登录
    const existing = Array.from(db.users.values()).find(u => u.nickname === nickname && !u.isDeleted);
    if (existing) {
      const result = await this.loginByNickname(nickname);
      return { ...result, isNew: false };
    }

    const id = `user_${uuidv4().slice(0, 8)}`;
    const user: User & { photos: string[]; interests: string[] } = {
      id,
      phone: '',
      nickname,
      gender: 0 as Gender,
      isVerified: false,
      vipStatus: 0,
      isOnline: true,
      lastActiveAt: new Date().toISOString(),
      isDeleted: false,
      dailySwipeLimit: 50,
      dailySwipeUsed: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      photos: [],
      interests: [],
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(nickname)}&background=FF6B6B&color=fff&size=200`,
    };
    db.users.set(id, user);
    const token = this.generateToken(id, '');
    const refreshToken = this.generateRefreshToken(id);
    return { user, token, refreshToken, isNew: true };
  }

  // 通过昵称登录（已有用户）
  async loginByNickname(nickname: string): Promise<{ user: User & { photos: string[]; interests: string[] }; token: string; refreshToken: string }> {
    const user = Array.from(db.users.values()).find(u => u.nickname === nickname && !u.isDeleted);
    if (!user) {
      throw new Error('用户不存在，请先注册');
    }
    user.isOnline = true;
    user.lastActiveAt = new Date().toISOString();
    user.updatedAt = new Date().toISOString();
    const token = this.generateToken(user.id, user.phone);
    const refreshToken = this.generateRefreshToken(user.id);
    return { user, token, refreshToken };
  }

  refreshToken(refreshToken: string): { token: string; refreshToken: string } {
    try {
      const payload = jwt.verify(refreshToken, config.jwt.secret) as JwtPayload & { type?: string };
      if (payload.type !== 'refresh') throw new Error('无效的刷新令牌');
      const user = db.users.get(payload.userId);
      if (!user || user.isDeleted) throw new Error('用户不存在');
      return {
        token: this.generateToken(user.id, user.phone),
        refreshToken: this.generateRefreshToken(user.id),
      };
    } catch {
      throw new Error('刷新令牌无效');
    }
  }

  // ========== 用户资料 ==========

  getMe(userId: string): User & { photos: string[]; interests: string[] } | null {
    const user = db.users.get(userId);
    return user || null;
  }

  getUserProfile(userId: string, viewerId?: string): UserPublic | null {
    const user = db.users.get(userId);
    if (!user || user.isDeleted) return null;
    return this.toPublicUser(user, viewerId);
  }

  updateProfile(userId: string, data: Partial<User>): User & { photos: string[]; interests: string[] } {
    const user = db.users.get(userId);
    if (!user) throw new Error('用户不存在');

    const allowedFields: (keyof User)[] = ['nickname', 'gender', 'birthday', 'city', 'district', 'bio', 'avatarUrl'];
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        (user as unknown as Record<string, unknown>)[field] = data[field];
      }
    });
    user.updatedAt = new Date().toISOString();
    return user;
  }

  updateLocation(userId: string, latitude: number, longitude: number): void {
    const user = db.users.get(userId);
    if (!user) throw new Error('用户不存在');
    user.latitude = latitude;
    user.longitude = longitude;
    user.lastActiveAt = new Date().toISOString();
    user.updatedAt = new Date().toISOString();
  }

  // ========== 兴趣标签 ==========

  updateInterests(userId: string, interests: string[]): string[] {
    const user = db.users.get(userId);
    if (!user) throw new Error('用户不存在');
    user.interests = interests.slice(0, 15);
    user.updatedAt = new Date().toISOString();
    return user.interests;
  }

  // ========== 真心话 ==========

  getQuestions(userId: string): UserQuestion[] {
    return Array.from(db.questions.values())
      .filter(q => q.userId === userId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  updateQuestion(userId: string, questionId: string, answer: string): UserQuestion {
    const q = db.questions.get(questionId);
    if (!q || q.userId !== userId) throw new Error('问题不存在');
    q.answer = answer;
    return q;
  }

  addQuestion(userId: string, question: string, answer: string): UserQuestion {
    const existing = this.getQuestions(userId);
    if (existing.length >= 10) throw new Error('最多添加10个问题');
    const q: UserQuestion = {
      id: uuidv4(),
      userId,
      question,
      answer,
      isPublic: true,
      sortOrder: existing.length,
    };
    db.questions.set(q.id, q);
    return q;
  }

  deleteQuestion(userId: string, questionId: string): void {
    const q = db.questions.get(questionId);
    if (!q || q.userId !== userId) throw new Error('问题不存在');
    db.questions.delete(questionId);
  }

  // ========== 发现页推荐 ==========

  getDiscoverFeed(userId: string, preferGender: Gender, page = 1, pageSize = 20): UserPublic[] {
    const me = db.users.get(userId);
    if (!me) return [];

    // 排除自己和已滑过的人
    const swipedIds = new Set(
      db.swipeRecords
        .filter(r => r.swiperId === userId)
        .map(r => r.swipedId)
    );

    const candidates = Array.from(db.users.values())
      .filter(u =>
        u.id !== userId &&
        !u.isDeleted &&
        u.gender === preferGender &&
        !swipedIds.has(u.id) &&
        u.photos.length > 0
      )
      .map(u => this.toPublicUser(u, userId))
      .filter(u => u !== null) as UserPublic[];

    // 简单排序：在线优先，活跃优先
    candidates.sort((a, b) => {
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
      return 0;
    });

    // 分页
    const start = (page - 1) * pageSize;
    return candidates.slice(start, start + pageSize);
  }

  // ========== 附近的人 ==========

  getNearby(userId: string, category?: string, page = 1, pageSize = 20): UserPublic[] {
    const me = db.users.get(userId);
    if (!me || me.latitude === undefined || me.longitude === undefined) return [];

    const candidates = Array.from(db.users.values())
      .filter(u =>
        u.id !== userId &&
        !u.isDeleted &&
        u.latitude !== undefined &&
        u.longitude !== undefined
      )
      .map(u => {
        const dist = this.calcDistance(me.latitude!, me.longitude!, u.latitude!, u.longitude!);
        const pub = this.toPublicUser(u, userId);
        if (pub) pub.distance = dist;
        return pub;
      })
      .filter(u => u !== null && u.distance !== undefined && u.distance <= 50)
      .sort((a, b) => (a!.distance || 0) - (b!.distance || 0)) as UserPublic[];

    const start = (page - 1) * pageSize;
    return candidates.slice(start, start + pageSize);
  }

  // ========== 辅助方法 ==========

  private toPublicUser(user: User & { photos: string[]; interests: string[] }, viewerId?: string): UserPublic | null {
    const age = user.birthday
      ? Math.floor((Date.now() - new Date(user.birthday).getTime()) / (365.25 * 24 * 3600 * 1000))
      : undefined;

    return {
      id: user.id,
      nickname: user.nickname,
      gender: user.gender,
      age,
      city: user.city,
      district: user.district,
      bio: user.bio,
      avatarUrl: user.photos[0] || user.avatarUrl,
      isOnline: user.isOnline,
      isVerified: user.isVerified,
      interests: user.interests,
      questions: Array.from(db.questions.values())
        .filter(q => q.userId === user.id && q.isPublic)
        .slice(0, 3),
    };
  }

  private calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}

export const userService = new UserService();
