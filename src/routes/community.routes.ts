import { Router, Response } from 'express';
import { communityService } from '../services/community.service';
import { authMiddleware } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /api/communities
router.get('/', (req: AuthRequest, res: Response) => {
  const category = req.query.category as string | undefined;
  const city = req.query.city as string | undefined;
  const page = parseInt(req.query.page as string || '1', 10);
  const communities = communityService.getCommunities(category, city, page);
  res.json({ code: 0, message: 'success', data: communities });
});

// POST /api/communities
router.post('/', (req: AuthRequest, res: Response) => {
  try {
    const { name, description, category, city, type } = req.body;
    const community = communityService.createCommunity(req.userId!, { name, description, category, city, type });
    res.json({ code: 0, message: '创建成功', data: community });
  } catch (err: unknown) {
    res.status(400).json({ code: 400, message: err instanceof Error ? err.message : '创建失败' });
  }
});

// GET /api/communities/:id
router.get('/:id', (req: AuthRequest, res: Response) => {
  const community = communityService.getCommunity(String(req.params.id));
  if (!community) return res.status(404).json({ code: 404, message: '社群不存在' });
  res.json({ code: 0, message: 'success', data: community });
});

// POST /api/communities/:id/join
router.post('/:id/join', (req: AuthRequest, res: Response) => {
  try {
    communityService.joinCommunity(String(req.params.id), req.userId!);
    res.json({ code: 0, message: '加入成功' });
  } catch (err: unknown) {
    res.status(400).json({ code: 400, message: err instanceof Error ? err.message : '加入失败' });
  }
});

// POST /api/communities/:id/leave
router.post('/:id/leave', (req: AuthRequest, res: Response) => {
  try {
    communityService.leaveCommunity(String(req.params.id), req.userId!);
    res.json({ code: 0, message: '已退出' });
  } catch (err: unknown) {
    res.status(400).json({ code: 400, message: err instanceof Error ? err.message : '退出失败' });
  }
});

// GET /api/communities/:id/members
router.get('/:id/members', (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string || '1', 10);
  const members = communityService.getMembers(String(req.params.id), page);
  res.json({ code: 0, message: 'success', data: members });
});

// GET /api/communities/my
router.get('/my/list', (req: AuthRequest, res: Response) => {
  const communities = communityService.getUserCommunities(req.userId!);
  res.json({ code: 0, message: 'success', data: communities });
});

// ========== 活动 ==========

// GET /api/communities/:id/activities
router.get('/:id/activities', (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string || '1', 10);
  const activities = communityService.getActivities(String(req.params.id), page);
  res.json({ code: 0, message: 'success', data: activities });
});

// POST /api/communities/:id/activities
router.post('/:id/activities', (req: AuthRequest, res: Response) => {
  try {
    const { title, description, location, start_time, end_time, fee_type, fee_amount, max_attendees } = req.body;
    const activity = communityService.createActivity(req.userId!, String(req.params.id), {
      title,
      description,
      location,
      startTime: start_time,
      endTime: end_time,
      feeType: fee_type || 0,
      feeAmount: fee_amount,
      maxAttendees: max_attendees || 20,
    });
    res.json({ code: 0, message: '发布成功', data: activity });
  } catch (err: unknown) {
    res.status(400).json({ code: 400, message: err instanceof Error ? err.message : '发布失败' });
  }
});

// GET /api/activities/:id
router.get('/activities/:id', (req: AuthRequest, res: Response) => {
  const activity = communityService.getActivity(String(req.params.id));
  if (!activity) return res.status(404).json({ code: 404, message: '活动不存在' });
  res.json({ code: 0, message: 'success', data: activity });
});

export default router;
