import { Router, Response } from 'express';
import { aiService } from '../services/ai.service';
import { authMiddleware } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// POST /api/ai/chat
router.post('/chat', async (req: AuthRequest, res: Response) => {
  try {
    const { message, conv_id } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ code: 400, message: '消息不能为空' });
    }
    const result = await aiService.chat(req.userId!, message.trim(), conv_id);
    res.json({
      code: 0,
      message: 'success',
      data: { content: result.reply, conv_id: result.convId },
    });
  } catch (err: unknown) {
    console.error('[AI] Chat error:', err);
    res.status(500).json({ code: 500, message: 'AI服务暂时不可用，请稍后再试' });
  }
});

// GET /api/ai/conversations
router.get('/conversations', async (req: AuthRequest, res: Response) => {
  try {
    const convs = await aiService.getConversations(req.userId!);
    res.json({ code: 0, message: 'success', data: convs });
  } catch (err: unknown) {
    res.status(500).json({ code: 500, message: '获取会话失败' });
  }
});

// GET /api/ai/settings
router.get('/settings', async (req: AuthRequest, res: Response) => {
  try {
    const settings = await aiService.getSettings(req.userId!);
    res.json({ code: 0, message: 'success', data: settings });
  } catch (err: unknown) {
    res.status(500).json({ code: 500, message: '获取设置失败' });
  }
});

// PUT /api/ai/settings
router.put('/settings', async (req: AuthRequest, res: Response) => {
  try {
    const settings = await aiService.updateSettings(req.userId!, req.body);
    res.json({ code: 0, message: '更新成功', data: settings });
  } catch (err: unknown) {
    res.status(500).json({ code: 500, message: '更新失败' });
  }
});

// GET /api/ai/reminders
router.get('/reminders', async (req: AuthRequest, res: Response) => {
  try {
    const reminders = await aiService.getReminders(req.userId!);
    res.json({ code: 0, message: 'success', data: reminders });
  } catch (err: unknown) {
    res.status(500).json({ code: 500, message: '获取提醒失败' });
  }
});

// POST /api/ai/reminders
router.post('/reminders', async (req: AuthRequest, res: Response) => {
  try {
    const { type, content, time, enabled = true } = req.body;
    if (!type || !content || !time) {
      return res.status(400).json({ code: 400, message: '缺少必要参数' });
    }
    const reminder = await aiService.createReminder(req.userId!, { type, content, time, enabled });
    res.json({ code: 0, message: '创建成功', data: reminder });
  } catch (err: unknown) {
    res.status(500).json({ code: 500, message: '创建失败' });
  }
});

// DELETE /api/ai/reminders/:id
router.delete('/reminders/:id', async (req: AuthRequest, res: Response) => {
  try {
    await aiService.deleteReminder(req.userId!, req.params.id);
    res.json({ code: 0, message: '已删除' });
  } catch (err: unknown) {
    res.status(500).json({ code: 500, message: '删除失败' });
  }
});

export default router;
