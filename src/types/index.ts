export type Gender = 0 | 1 | 2 | 3; // 0=未设置, 1=男, 2=女, 3=其他
export type SwipeAction = 1 | 2 | 3; // 1=跳过, 2=喜欢, 3=超级喜欢
export type VerificationType = 1 | 2 | 3 | 4; // 1=身份, 2=学历, 3=职业, 4=单身
export type VerificationStatus = 0 | 1 | 2; // 0=待审核, 1=通过, 2=拒绝
export type CommunityType = 1 | 2 | 3; // 1=公开, 2=审核, 3=私密
export type MessageType = 1 | 2 | 3 | 4 | 5; // 1=text, 2=image, 3=voice, 4=location, 5=system
export type ConversationType = 1 | 2; // 1=私聊, 2=群聊
export type VipStatus = 0 | 1 | 2 | 3; // 0=免费, 1=月卡, 2=季卡, 3=年卡
export type ActivityStatus = 0 | 1 | 2 | 3; // 0=报名中, 1=进行中, 2=已结束, 3=已取消
export type MemberRole = 0 | 1 | 2; // 0=成员, 1=管理员, 2=群主

export interface User {
  id: string;
  phone: string;
  nickname: string;
  gender: Gender;
  birthday?: string;
  city?: string;
  district?: string;
  bio?: string;
  avatarUrl?: string;
  latitude?: number;
  longitude?: number;
  isVerified: boolean;
  vipStatus: VipStatus;
  vipExpireAt?: string;
  isOnline: boolean;
  lastActiveAt: string;
  isDeleted: boolean;
  dailySwipeLimit: number;
  dailySwipeUsed: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserPublic {
  id: string;
  nickname: string;
  gender: Gender;
  age?: number;
  city?: string;
  district?: string;
  bio?: string;
  avatarUrl?: string;
  distance?: number;
  isOnline: boolean;
  isVerified: boolean;
  interests: string[];
  questions?: UserQuestion[];
}

export interface UserQuestion {
  id: string;
  userId: string;
  question: string;
  answer: string;
  isPublic: boolean;
  sortOrder: number;
}

export interface SwipeRecord {
  id: string;
  swiperId: string;
  swipedId: string;
  action: SwipeAction;
  createdAt: string;
}

export interface Match {
  id: string;
  userAId: string;
  userBId: string;
  matchType: 1 | 2;
  createdAt: string;
  unmatchedAt?: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  targetId?: string;
  lastMessageId?: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Message {
  id: string;
  convId: string;
  senderId: string;
  type: MessageType;
  content?: string;
  mediaUrl?: string;
  duration?: number;
  latitude?: number;
  longitude?: number;
  isRecalled: boolean;
  readAt?: string;
  recalledAt?: string;
  createdAt: string;
}

export interface Community {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  category: string;
  city?: string;
  type: CommunityType;
  ownerId: string;
  memberCount: number;
  maxMembers: number;
  isActive: boolean;
  createdAt: string;
}

export interface CommunityMember {
  id: string;
  communityId: string;
  userId: string;
  role: MemberRole;
  status: 1 | 2 | 3;
  joinedAt: string;
}

export interface Activity {
  id: string;
  communityId: string;
  creatorId: string;
  title: string;
  description?: string;
  coverUrl?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  startTime: string;
  endTime: string;
  feeType: 0 | 1 | 2;
  feeAmount?: number;
  maxAttendees: number;
  curAttendees: number;
  signupDeadline?: string;
  status: ActivityStatus;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data?: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total?: number;
  page?: number;
  pageSize?: number;
}

export interface JwtPayload {
  userId: string;
  phone: string;
}
