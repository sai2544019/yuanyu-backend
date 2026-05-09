import prisma from '../db/prisma';
import { config } from '../config';

interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `你是「臻我」的AI专属助理，名字叫小臻。你的定位是温暖陪伴型AI伙伴，专注于帮助单身用户提升生活品质、解答情感困惑、提供生活建议。

核心原则：
- 温暖、真诚、有同理心
- 回复简洁有力，避免废话
- 鼓励用户积极生活、培养爱好
- 不敷衍，不说教，像朋友一样聊天
- 如果用户问生活建议（美食、运动、旅行），给出具体推荐
- 如果用户情绪低落，给予安慰和鼓励

背景信息：用户是「臻我」单身生活美学平台的用户，平台提供智能匹配、私聊、AI陪伴等功能。用户可能正在寻找志同道合的伙伴，或者只是想找人说说话。

称呼用户为「你」，自称「小臻」。`;

export class AiService {
  async chat(userId: string, message: string, convId?: string): Promise<{ reply: string; convId: string }> {
    // Get or create conversation
    let conv;
    if (convId) {
      conv = await prisma.aiConversation.findUnique({ where: { id: convId } });
      if (!conv || conv.userId !== userId) {
        conv = await this.createConversation(userId);
      }
    } else {
      conv = await this.createConversation(userId);
    }

    // Load message history (last 20 messages)
    const history = await prisma.aiMessage.findMany({
      where: { convId: conv.id },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    // Build messages array
    const messages: AiMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: message },
    ];

    const reply = await this.callLlm(messages);

    // Save user message
    await prisma.aiMessage.create({
      data: { convId: conv.id, role: 'user', content: message },
    });

    // Save assistant reply
    await prisma.aiMessage.create({
      data: { convId: conv.id, role: 'assistant', content: reply },
    });

    // Update conversation timestamp
    await prisma.aiConversation.update({
      where: { id: conv.id },
      data: { updatedAt: new Date() },
    });

    return { reply, convId: conv.id };
  }

  async getConversations(userId: string) {
    return prisma.aiConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });
  }

  async getOrCreateDefaultConv(userId: string) {
    return this.createConversation(userId);
  }

  async getSettings(userId: string) {
    const conv = await this.createConversation(userId);
    return conv.settings ? JSON.parse(conv.settings) : { persona: 'warm', name: '小臻' };
  }

  async updateSettings(userId: string, settings: Record<string, unknown>) {
    const conv = await this.createConversation(userId);
    return prisma.aiConversation.update({
      where: { id: conv.id },
      data: { settings: JSON.stringify(settings) },
    });
  }

  // ========== Reminders ==========

  async getReminders(userId: string) {
    const reminders = await prisma.reminder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return reminders.map(r => ({ ...r }));
  }

  async createReminder(userId: string, data: { type: string; content: string; time: string; enabled?: boolean }) {
    return prisma.reminder.create({
      data: { userId, ...data },
    });
  }

  async deleteReminder(userId: string, id: string) {
    await prisma.reminder.deleteMany({ where: { id, userId } });
  }

  // ========== Private ==========

  private async createConversation(userId: string) {
    let conv = await prisma.aiConversation.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    if (!conv) {
      conv = await prisma.aiConversation.create({
        data: {
          userId,
          settings: JSON.stringify({ persona: 'warm', name: '小臻' }),
        },
      });
    }
    return conv;
  }

  private async callLlm(messages: AiMessage[]): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;

    if (apiKey?.startsWith('sk-ant-')) {
      return this.callClaude(messages, apiKey);
    } else if (apiKey?.startsWith('sk-')) {
      return this.callOpenAi(messages, apiKey);
    } else {
      return this.fallbackReply(messages);
    }
  }

  private async callClaude(messages: AiMessage[], apiKey: string): Promise<string> {
    const system = messages.find(m => m.role === 'system')?.content || '';
    const conversation = messages.filter(m => m.role !== 'system');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        system,
        messages: conversation.map(m => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[AI] Claude API error:', err);
      return this.fallbackReply(messages);
    }

    const data = await response.json() as { content: Array<{ type: string; text: string }> };
    return data.content[0]?.text || '嗯，我明白了~';
  }

  private async callOpenAi(messages: AiMessage[], apiKey: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 512,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[AI] OpenAI API error:', err);
      return this.fallbackReply(messages);
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices[0]?.message?.content || '嗯，我明白了~';
  }

  private fallbackReply(messages: AiMessage[]): string {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
    const msg = lastUserMsg.toLowerCase();

    if (msg.includes('心情') || msg.includes('不好') || msg.includes('难过') || msg.includes('郁闷')) {
      return '有时候低落是身体在提醒你该休息了~ 不管怎样，我都在这里陪着你。今晚早点睡，明天又是新的一天 🌙';
    }
    if (msg.includes('吃') || msg.includes('美食') || msg.includes('推荐')) {
      return '最近发现一家超棒的咖啡店☕ 环境很适合一个人待着，安静又有氛围。或者你想试试在家做一道简单的料理？我可以推荐你几道零失败的家常菜~';
    }
    if (msg.includes('运动') || msg.includes('健身') || msg.includes('跑步')) {
      return '运动是蕞好的多巴胺来源！今天试试早起拉伸10分钟，一整天都会精神很多。如果你想制定运动计划，告诉我你的目标和喜好，我来帮你规划 🏃';
    }
    if (msg.includes('无聊') || msg.includes('没事干')) {
      return '无聊的时候正是探索新事物的好时机~ 试试：看一部收藏已久的电影、听一张新专辑、或者学一道新菜？生活的小确幸往往就藏在这些小事里 ✨';
    }
    if (msg.includes('认识') || msg.includes('朋友') || msg.includes('社交')) {
      return '「臻我」里有很多有趣的人呢~ 不妨在发现页多看看，说不定就遇到志同道合的伙伴了！记得完善你的资料，兴趣爱好写清楚，匹配会更精准哦 💕';
    }
    if (msg.includes('睡') || msg.includes('累') || msg.includes('困')) {
      return '要注意休息呀~ 今晚试着早点放下手机，给大脑一个放松的时间。睡前泡个脚或者喝杯热牛奶，有助于提升睡眠质量 🌙';
    }
    if (msg.includes('帮助') || msg.includes('能做什么') || msg.includes('功能')) {
      return '我可以帮你：\n• 陪你聊天，倾听你的心事\n• 给你生活建议（美食、运动、旅行）\n• 帮你制定计划\n• 社交破冰话题推荐\n• 设置健康提醒（喝水、吃饭、睡觉）\n有什么想问的，尽管说~';
    }
    return '很高兴和你聊天！😊 我是你的专属AI助理小臻，随时都在。有什么想聊的，或者需要什么帮助，直接告诉我~';
  }
}

export const aiService = new AiService();
