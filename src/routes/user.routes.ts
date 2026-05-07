import { Router, Request, Response } from 'express';
import { userService } from '../services/user.service';
import { authMiddleware } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

// ========== 认证后路由 ==========
router.use(authMiddleware);

// GET /api/users/me
router.get('/me', (req: AuthRequest, res: Response) => {
  const user = userService.getMe(req.userId!);
  if (!user) return res.status(404).json({ code: 404, message: '用户不存在' });
  res.json({
    code: 0,
    message: 'success',
    data: {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      gender: user.gender,
      birthday: user.birthday,
      city: user.city,
      district: user.district,
      bio: user.bio,
      avatar_url: user.photos[0] || user.avatarUrl,
      photos: user.photos,
      interests: user.interests,
      is_verified: user.isVerified,
      vip_status: user.vipStatus,
      is_online: user.isOnline,
      created_at: user.createdAt,
    },
  });
});

// PUT /api/users/me
router.put('/me', async (req: AuthRequest, res: Response) => {
  try {
    const { nickname, gender, birthday, city, district, bio, avatar_url } = req.body;
    const user = userService.updateProfile(req.userId!, { nickname, gender, birthday, city, district, bio, avatarUrl: avatar_url });
    res.json({ code: 0, message: '更新成功', data: user });
  } catch (err: unknown) {
    res.status(400).json({ code: 400, message: err instanceof Error ? err.message : '更新失败' });
  }
});

// PUT /api/users/me/location
router.put('/me/location', (req: AuthRequest, res: Response) => {
  try {
    const { latitude, longitude } = req.body;
    userService.updateLocation(req.userId!, latitude, longitude);
    res.json({ code: 0, message: '位置已更新' });
  } catch (err: unknown) {
    res.status(400).json({ code: 400, message: err instanceof Error ? err.message : '更新失败' });
  }
});

// GET /api/users/me/questions
router.get('/me/questions', (req: AuthRequest, res: Response) => {
  const questions = userService.getQuestions(req.userId!);
  res.json({ code: 0, message: 'success', data: questions });
});

// PUT /api/users/me/questions/:id
router.put('/me/questions/:id', (req: AuthRequest, res: Response) => {
  try {
    const { answer } = req.body;
    const q = userService.updateQuestion(req.userId!, String(req.params.id), answer);
    res.json({ code: 0, message: '更新成功', data: q });
  } catch (err: unknown) {
    res.status(400).json({ code: 400, message: err instanceof Error ? err.message : '更新失败' });
  }
});

// POST /api/users/me/questions
router.post('/me/questions', (req: AuthRequest, res: Response) => {
  try {
    const { question, answer } = req.body;
    const q = userService.addQuestion(req.userId!, question, answer);
    res.json({ code: 0, message: '创建成功', data: q });
  } catch (err: unknown) {
    res.status(400).json({ code: 400, message: err instanceof Error ? err.message : '创建失败' });
  }
});

// DELETE /api/users/me/questions/:id
router.delete('/me/questions/:id', (req: AuthRequest, res: Response) => {
  try {
    userService.deleteQuestion(req.userId!, String(req.params.id));
    res.json({ code: 0, message: '删除成功' });
  } catch (err: unknown) {
    res.status(400).json({ code: 400, message: err instanceof Error ? err.message : '删除失败' });
  }
});

// PUT /api/users/me/interests
router.put('/me/interests', (req: AuthRequest, res: Response) => {
  try {
    const { interests } = req.body;
    const result = userService.updateInterests(req.userId!, interests);
    res.json({ code: 0, message: '更新成功', data: result });
  } catch (err: unknown) {
    res.status(400).json({ code: 400, message: err instanceof Error ? err.message : '更新失败' });
  }
});

// GET /api/users/discover
router.get('/discover', (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string || '1', 10);
  const gender = parseInt(req.query.gender as string || '2', 10) as 1 | 2 | 3;
  const feed = userService.getDiscoverFeed(req.userId!, gender, page);
  res.json({ code: 0, message: 'success', data: feed });
});

// GET /api/users/nearby
router.get('/nearby', (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string || '1', 10);
  const category = req.query.category as string | undefined;
  const nearby = userService.getNearby(req.userId!, category, page);
  res.json({ code: 0, message: 'success', data: nearby });
});

// GET /api/users/:id
router.get('/:id', (req: AuthRequest, res: Response) => {
  const profile = userService.getUserProfile(String(req.params.id), req.userId);
  if (!profile) return res.status(404).json({ code: 404, message: '用户不存在' });
  res.json({ code: 0, message: 'success', data: profile });
});

export default router;
