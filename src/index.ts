import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config';

// 路由
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import matchRoutes from './routes/match.routes';
import chatRoutes from './routes/chat.routes';
import communityRoutes from './routes/community.routes';

const app = express();

// 中间件
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/swipe', matchRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/conversations', chatRoutes);
app.use('/api/communities', communityRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在' });
});

// 错误处理
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server Error:', err);
  res.status(500).json({ code: 500, message: '服务器错误' });
});

app.listen(config.port, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🚀 缘遇 API Server 启动成功                    ║
║                                                   ║
║   环境:    ${config.nodeEnv.padEnd(38)}║
║   端口:    ${String(config.port).padEnd(38)}║
║   API地址: http://localhost:${config.port}/api        ║
║                                                   ║
║   健康检查: http://localhost:${config.port}/health        ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
});

export default app;
