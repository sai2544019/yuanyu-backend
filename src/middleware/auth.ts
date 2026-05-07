import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import type { JwtPayload } from '../types';

export interface AuthRequest extends Request {
  userId?: string;
  userPhone?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未登录' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.userId = payload.userId;
    req.userPhone = payload.phone;
    next();
  } catch {
    return res.status(401).json({ code: 401, message: '登录已过期' });
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
      req.userId = payload.userId;
      req.userPhone = payload.phone;
    } catch {
      // 忽略错误，继续
    }
  }
  next();
}
