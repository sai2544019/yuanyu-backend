import { Router, Request, Response } from 'express';
import { userService } from '../services/user.service';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// POST /api/auth/register — 一键注册，直接用昵称
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { nickname } = req.body;
    if (!nickname || nickname.trim().length < 1) {
      return res.status(400).json({ code: 400, message: '请输入昵称' });
    }
    const result = await userService.register(nickname.trim().slice(0, 20));
    res.json({
      code: 0,
      message: result.isNew ? '注册成功' : '登录成功',
      data: {
        access_token: result.token,
        refresh_token: result.refreshToken,
        expires_in: 900,
        user: {
          id: result.user.id,
          nickname: result.user.nickname,
          avatar_url: result.user.avatarUrl,
          is_new: result.isNew,
        },
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '注册失败';
    res.status(500).json({ code: 500, message });
  }
});

// POST /api/auth/login — 直接输入昵称登录
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { nickname } = req.body;
    if (!nickname || nickname.trim().length < 1) {
      return res.status(400).json({ code: 400, message: '请输入昵称' });
    }
    const result = await userService.loginByNickname(nickname.trim());
    res.json({
      code: 0,
      message: '登录成功',
      data: {
        access_token: result.token,
        refresh_token: result.refreshToken,
        expires_in: 900,
        user: {
          id: result.user.id,
          nickname: result.user.nickname,
          avatar_url: result.user.avatarUrl,
          is_new: false,
        },
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '登录失败';
    res.status(401).json({ code: 401, message });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ code: 400, message: '缺少refresh_token' });
    }
    const result = userService.refreshToken(refresh_token);
    res.json({
      code: 0,
      message: '刷新成功',
      data: {
        access_token: result.token,
        refresh_token: result.refreshToken,
        expires_in: 900,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '刷新失败';
    res.status(401).json({ code: 401, message });
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, async (_req: Request, res: Response) => {
  res.json({ code: 0, message: '已退出登录' });
});

export default router;
