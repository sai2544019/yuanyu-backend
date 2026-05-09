import { Router, Request, Response } from 'express';
import prisma from '../db/prisma';
import jwt from 'jsonwebtoken';
import { config } from '../config';

const router = Router();

// In-memory code store (MVP: no Redis)
const codeStore = new Map<string, { code: string; expiresAt: Date }>();

function generateCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function generateTokens(userId: string) {
  const token = jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiresIn,
  });
  const refreshToken = jwt.sign({ userId, type: 'refresh' }, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
  return { token, refreshToken };
}

// POST /api/auth/phone/send-code
router.post('/send-code', async (req: Request, res: Response) => {
  const { phone } = req.body;
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ code: 400, message: '请输入正确的手机号' });
  }

  const code = generateCode();
  codeStore.set(phone, { code, expiresAt: new Date(Date.now() + 5 * 60 * 1000) });

  // TODO: Integrate real SMS provider (e.g. Twilio, Aliyun)
  console.log(`[SMS] 验证码 ${phone}: ${code}`);

  res.json({ code: 0, message: '验证码已发送', data: { phone } });
});

// POST /api/auth/phone/verify-code
router.post('/verify-code', async (req: Request, res: Response) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ code: 400, message: '缺少参数' });
  }

  const record = codeStore.get(phone);
  if (!record) {
    return res.status(400).json({ code: 400, message: '请先获取验证码' });
  }
  if (new Date() > record.expiresAt) {
    codeStore.delete(phone);
    return res.status(400).json({ code: 400, message: '验证码已过期，请重新获取' });
  }
  if (record.code !== code) {
    return res.status(400).json({ code: 400, message: '验证码错误' });
  }
  codeStore.delete(phone);

  // Find or create user
  let user = await prisma.user.findUnique({ where: { phone } });
  const isNew = !user;

  if (!user) {
    user = await prisma.user.create({
      data: {
        phone,
        nickname: `用户${phone.slice(-4)}`,
        avatarUrl: `https://ui-avatars.com/api/?name=${phone.slice(-4)}&background=FF6B6B&color=fff&size=200`,
        photos: JSON.stringify([]),
        interests: JSON.stringify([]),
      },
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isOnline: true, lastActiveAt: new Date() },
  });

  const { token, refreshToken } = generateTokens(user.id);

  res.json({
    code: 0,
    message: '登录成功',
    data: {
      access_token: token,
      refresh_token: refreshToken,
      expires_in: 900,
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar_url: user.avatarUrl,
        is_new: isNew,
      },
    },
  });
});

// POST /api/auth/survey — 提交首次调研问卷
router.post('/survey', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未登录' });
  }

  let userId: string;
  try {
    const payload = jwt.verify(authHeader.slice(7), config.jwt.secret) as { userId: string };
    userId = payload.userId;
  } catch {
    return res.status(401).json({ code: 401, message: '登录已过期' });
  }

  const { purposes = [], habits = [] } = req.body;

  await prisma.user.update({
    where: { id: userId },
    data: {
      interests: JSON.stringify([...purposes, ...habits].slice(0, 15)),
    },
  });

  res.json({ code: 0, message: '调研已保存' });
});

export default router;
