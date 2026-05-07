import { Router, Request, Response } from 'express';
import { matchService } from '../services/match.service';
import { authMiddleware } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// POST /api/swipe
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { target_id, action } = req.body;
    if (!target_id || !action) {
      return res.status(400).json({ code: 400, message: '参数不完整' });
    }
    const result = matchService.swipe(req.userId!, target_id, action);
    res.json({ code: 0, message: '操作成功', data: result });
  } catch (err: unknown) {
    res.status(400).json({ code: 400, message: err instanceof Error ? err.message : '操作失败' });
  }
});

// GET /api/matches
router.get('/', (req: AuthRequest, res: Response) => {
  const matches = matchService.getMatches(req.userId!);
  res.json({ code: 0, message: 'success', data: matches });
});

// DELETE /api/matches/:id
router.delete('/:id', (req: AuthRequest, res: Response) => {
  try {
    matchService.unmatch(req.userId!, String(req.params.id));
    res.json({ code: 0, message: '已取消匹配' });
  } catch (err: unknown) {
    res.status(400).json({ code: 400, message: err instanceof Error ? err.message : '操作失败' });
  }
});

// POST /api/matches/:id/block
router.post('/:id/block', (req: AuthRequest, res: Response) => {
  try {
    matchService.blockUser(req.userId!, String(req.params.id));
    res.json({ code: 0, message: '已拉黑' });
  } catch (err: unknown) {
    res.status(400).json({ code: 400, message: err instanceof Error ? err.message : '操作失败' });
  }
});

// POST /api/matches/report
router.post('/report', (req: AuthRequest, res: Response) => {
  try {
    const { reported_id, reason, description } = req.body;
    matchService.reportUser(req.userId!, reported_id, reason, description);
    res.json({ code: 0, message: '举报已收到，我们会尽快处理' });
  } catch (err: unknown) {
    res.status(400).json({ code: 400, message: err instanceof Error ? err.message : '举报失败' });
  }
});

export default router;
