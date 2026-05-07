import { Router, Request, Response } from 'express';
import { chatService } from '../services/chat.service';
import { authMiddleware } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /api/conversations
router.get('/', (req: AuthRequest, res: Response) => {
  const convs = chatService.getConversations(req.userId!);
  res.json({ code: 0, message: 'success', data: convs });
});

// GET /api/conversations/:id/messages
router.get('/:id/messages', (req: AuthRequest, res: Response) => {
  try {
    const cursor = req.query.cursor as string | undefined;
    const limit = parseInt(req.query.limit as string || '20', 10);
    const messages = chatService.getMessages(String(req.params.id), req.userId!, cursor, limit);
    res.json({ code: 0, message: 'success', data: messages });
  } catch (err: unknown) {
    res.status(400).json({ code: 400, message: err instanceof Error ? err.message : '获取失败' });
  }
});

// POST /api/conversations/:id/messages
router.post('/:id/messages', (req: AuthRequest, res: Response) => {
  try {
    const { type, content, media_url } = req.body;
    const msg = chatService.sendMessage(String(req.params.id), req.userId!, type || 1, content, media_url);
    res.json({ code: 0, message: '发送成功', data: msg });
  } catch (err: unknown) {
    res.status(400).json({ code: 400, message: err instanceof Error ? err.message : '发送失败' });
  }
});

// POST /api/conversations/:id/read
router.post('/:id/read', (req: AuthRequest, res: Response) => {
  chatService.markRead(String(req.params.id), req.userId!);
  res.json({ code: 0, message: '已标记已读' });
});

// POST /api/conversations/:id/messages/:msgId/recall
router.post('/:id/messages/:msgId/recall', (req: AuthRequest, res: Response) => {
  try {
    chatService.recallMessage(String(req.params.msgId), req.userId!);
    res.json({ code: 0, message: '已撤回' });
  } catch (err: unknown) {
    res.status(400).json({ code: 400, message: err instanceof Error ? err.message : '撤回失败' });
  }
});

// POST /api/conversations/match/:otherId
router.post('/match/:otherId', (req: AuthRequest, res: Response) => {
  const conv = chatService.getOrCreateMatchConversation(req.userId!, String(req.params.otherId));
  res.json({ code: 0, message: 'success', data: conv });
});

export default router;
