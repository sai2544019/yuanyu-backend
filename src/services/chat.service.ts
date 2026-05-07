import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import type { Message, Conversation } from '../types';

export class ChatService {
  // 获取会话列表
  getConversations(userId: string): Array<Conversation & { lastMessage?: Message; unreadCount: number; otherUser?: object }> {
    const results: Array<Conversation & { lastMessage?: Message; unreadCount: number; otherUser?: object }> = [];

    db.conversations.forEach(conv => {
      if (conv.type === 1 && conv.targetId === userId) {
        // 私聊会话
        const otherUserId = conv.id.split('_')[1]; // 简化处理
        const otherUser = db.users.get(otherUserId);

        const messages = Array.from(db.messages.values())
          .filter(m => m.convId === conv.id && !m.isRecalled)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const unreadCount = messages.filter(m =>
          m.senderId !== userId &&
          !m.readAt
        ).length;

        results.push({
          ...conv,
          lastMessage: messages[0],
          unreadCount,
          otherUser: otherUser ? {
            id: otherUser.id,
            nickname: otherUser.nickname,
            avatarUrl: otherUser.photos[0] || otherUser.avatarUrl,
            isOnline: otherUser.isOnline,
          } : undefined,
        });
      }
    });

    // 也包括我作为参与者的会话
    db.conversations.forEach(conv => {
      if (conv.type === 1) {
        const msgs = Array.from(db.messages.values())
          .filter(m => m.convId === conv.id && !m.isRecalled);
        if (msgs.some(m => m.senderId === userId)) {
          const alreadyAdded = results.find(r => r.id === conv.id);
          if (!alreadyAdded) {
            const otherId = msgs.find(m => m.senderId !== userId)?.senderId || msgs[0]?.senderId;
            const otherUser = otherId ? db.users.get(otherId) : null;

            results.push({
              ...conv,
              lastMessage: msgs.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )[0],
              unreadCount: 0,
              otherUser: otherUser ? {
                id: otherUser.id,
                nickname: otherUser.nickname,
                avatarUrl: otherUser.photos[0] || otherUser.avatarUrl,
                isOnline: otherUser.isOnline,
              } : undefined,
            });
          }
        }
      }
    });

    return results.sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return timeB - timeA;
    });
  }

  // 获取历史消息
  getMessages(convId: string, userId: string, cursor?: string, limit = 20): Message[] {
    const conv = db.conversations.get(convId);
    if (!conv) throw new Error('会话不存在');

    let messages = Array.from(db.messages.values())
      .filter(m => m.convId === convId && !m.isRecalled)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (cursor) {
      const idx = messages.findIndex(m => m.id === cursor);
      if (idx > 0) messages = messages.slice(0, idx);
    }

    return messages.slice(-limit);
  }

  // 发送消息
  sendMessage(convId: string, senderId: string, type: 1 | 2 | 3 | 4, content?: string, mediaUrl?: string): Message {
    const conv = db.conversations.get(convId);
    if (!conv) throw new Error('会话不存在');

    const message: Message = {
      id: `msg_${uuidv4().slice(0, 8)}`,
      convId,
      senderId,
      type,
      content,
      mediaUrl,
      isRecalled: false,
      createdAt: new Date().toISOString(),
    };

    db.messages.set(message.id, message);
    conv.lastMessageId = message.id;
    conv.lastMessageAt = message.createdAt;
    conv.updatedAt = message.createdAt;

    return message;
  }

  // 标记已读
  markRead(convId: string, userId: string): void {
    const messages = Array.from(db.messages.values())
      .filter(m => m.convId === convId && m.senderId !== userId && !m.isRecalled);

    messages.forEach(m => {
      if (!m.readAt) m.readAt = new Date().toISOString();
    });
  }

  // 撤回消息
  recallMessage(messageId: string, userId: string): void {
    const message = db.messages.get(messageId);
    if (!message) throw new Error('消息不存在');
    if (message.senderId !== userId) throw new Error('只能撤回自己的消息');

    const diff = Date.now() - new Date(message.createdAt).getTime();
    if (diff > 2 * 60 * 1000) throw new Error('超过2分钟无法撤回');

    message.isRecalled = true;
    message.recalledAt = new Date().toISOString();
  }

  // 获取匹配对话的会话
  getOrCreateMatchConversation(userId: string, otherUserId: string): Conversation {
    // 查找是否已存在会话
    for (const conv of db.conversations.values()) {
      if (conv.type === 1 && conv.targetId === otherUserId) {
        return conv;
      }
    }

    // 创建新会话
    const convId = `conv_${uuidv4().slice(0, 8)}`;
    const conv: Conversation = {
      id: convId,
      type: 1,
      targetId: otherUserId,
      createdAt: new Date().toISOString(),
    };
    db.conversations.set(convId, conv);
    return conv;
  }
}

export const chatService = new ChatService();
