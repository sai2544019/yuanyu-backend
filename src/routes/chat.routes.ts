import { Router, Request, Response } from 'express';
import { chatService } from '../services/chat.service';
import { authMiddleware } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /api/conversations
router.get('/', async (req: AuthRequest, res: Response) => {
  const convs = await chatService.getConversations(req.userId!);
  res.json({ code: 0, message: 'success', data: convs });
});

// GET /api/conversations/:id/messages
router.get('/:id/messages', async (req: AuthRequest, res: Response) => {
  try {
    const cursor = req.query.cursor as string | undefined;
    const limit = parseInt(req.query.limit as string || '20', 10);
    const messages = await chatService.getMessages(String(req.params.id), req.userId!, cursor, limit);
    res.json({ code: 0, message: 'success', data: messages });
  } catch (err: unknown) {
    res.status(400).json({ code: 400, message: err instanceof Error ? err.message : '获取失败' });
  }
});

// POST /api/conversations/:id/messages
router.post('/:id/messages', async (req: AuthRequest, res: Response) => {
  try {
    const { type, content, media_url } = req.body;
    const msg = await chatService.sendMessage(String(req.params.id), req.userId!, type || 1, content, media_url);
    res.json({ code: 0, message: '发送成功', data: msg });
  } catch (err: unknown) {
    res.status(400).json({ code: 400, message: err instanceof Error ? err.message : '发送失败' });
  }
});

// POST /api/conversations/:id/read
router.post('/:id/read', async (req: AuthRequest, res: Response) => {
  await chatService.markRead(String(req.params.id), req.userId!);
  res.json({ code: 0, message: '已标记已读' });
});

// POST /api/conversations/:id/messages/:msgId/recall
router.post('/:id/messages/:msgId/recall', async (req: AuthRequest, res: Response) => {
  try {
    await chatService.recallMessage(String(req.params.msgId), req.userId!);
    res.json({ code: 0, message: '已撤回' });
  } catch (err: unknown) {
    res.status(400).json({ code: 400, message: err instanceof Error ? err.message : '撤回失败' });
  }
});

// POST /api/conversations/match/:otherId
router.post('/match/:otherId', async (req: AuthRequest, res: Response) => {
  const conv = await chatService.getOrCreateMatchConversation(req.userId!, String(req.params.otherId));
  res.json({ code: 0, message: 'success', data: conv });
});

export default router;
