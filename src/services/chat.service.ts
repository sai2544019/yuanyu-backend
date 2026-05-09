import prisma from '../db/prisma';

export class ChatService {
  // 获取会话列表
  async getConversations(userId: string) {
    const convs = await prisma.conversation.findMany({
      where: {
        type: 1,
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        userA: {
          select: { id: true, nickname: true, avatarUrl: true, photos: true, isOnline: true },
        },
        userB: {
          select: { id: true, nickname: true, avatarUrl: true, photos: true, isOnline: true },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    const results = [];
    for (const conv of convs) {
      const other = conv.userAId === userId ? conv.userB : conv.userA;
      const otherPhotos = JSON.parse(other?.photos || '[]') as string[];

      // 未读数：对方发送的、未被撤回的、未读的
      const unreadCount = await prisma.message.count({
        where: {
          convId: conv.id,
          senderId: { not: userId },
          isRecalled: false,
          readAt: null,
        },
      });

      // 最新消息
      const lastMsg = await prisma.message.findFirst({
        where: { convId: conv.id, isRecalled: false },
        orderBy: { createdAt: 'desc' },
      });

      results.push({
        id: conv.id,
        type: conv.type,
        userAId: conv.userAId,
        userBId: conv.userBId,
        lastMessageAt: conv.lastMessageAt,
        createdAt: conv.createdAt,
        lastMessage: lastMsg ? {
          id: lastMsg.id,
          convId: lastMsg.convId,
          senderId: lastMsg.senderId,
          type: lastMsg.type,
          content: lastMsg.content,
          mediaUrl: lastMsg.mediaUrl,
          isRecalled: lastMsg.isRecalled,
          createdAt: lastMsg.createdAt,
        } : undefined,
        unreadCount,
        otherUser: other ? {
          id: other.id,
          nickname: other.nickname,
          avatarUrl: otherPhotos[0] || other.avatarUrl,
          isOnline: other.isOnline,
        } : undefined,
      });
    }

    return results;
  }

  // 获取历史消息
  async getMessages(convId: string, userId: string, cursor?: string, limit = 20) {
    const conv = await prisma.conversation.findFirst({
      where: {
        id: convId,
        OR: [{ userAId: userId }, { userBId: userId }],
      },
    });
    if (!conv) throw new Error('会话不存在');

    const where: Record<string, unknown> = { convId, isRecalled: false };
    if (cursor) {
      const cursorMsg = await prisma.message.findUnique({ where: { id: cursor } });
      if (cursorMsg) {
        where.createdAt = { lt: cursorMsg.createdAt };
      }
    }

    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return messages.reverse();
  }

  // 发送消息
  async sendMessage(convId: string, senderId: string, type: number, content?: string, mediaUrl?: string) {
    const conv = await prisma.conversation.findFirst({
      where: {
        id: convId,
        OR: [{ userAId: senderId }, { userBId: senderId }],
      },
    });
    if (!conv) throw new Error('会话不存在');

    const msg = await prisma.message.create({
      data: { convId, senderId, type, content, mediaUrl },
    });

    // 更新会话的最新消息
    await prisma.conversation.update({
      where: { id: convId },
      data: { lastMessageId: msg.id, lastMessageAt: msg.createdAt },
    });

    return msg;
  }

  // 标记已读
  async markRead(convId: string, userId: string): Promise<void> {
    await prisma.message.updateMany({
      where: { convId, senderId: { not: userId }, isRecalled: false, readAt: null },
      data: { readAt: new Date() },
    });
  }

  // 撤回消息
  async recallMessage(messageId: string, userId: string): Promise<void> {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new Error('消息不存在');
    if (message.senderId !== userId) throw new Error('只能撤回自己的消息');

    const diff = Date.now() - message.createdAt.getTime();
    if (diff > 2 * 60 * 1000) throw new Error('超过2分钟无法撤回');

    await prisma.message.update({
      where: { id: messageId },
      data: { isRecalled: true, recalledAt: new Date() },
    });
  }

  // 获取或创建匹配会话
  async getOrCreateMatchConversation(userId: string, otherUserId: string) {
    // 查找已有的私聊会话
    let conv = await prisma.conversation.findFirst({
      where: {
        type: 1,
        OR: [
          { userAId: userId, userBId: otherUserId },
          { userAId: otherUserId, userBId: userId },
        ],
      },
    });

    if (!conv) {
      conv = await prisma.conversation.create({
        data: { type: 1, userAId: userId, userBId: otherUserId },
      });
    }

    return conv;
  }
}

export const chatService = new ChatService();
