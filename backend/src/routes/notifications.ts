import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { ensureNotificationsTable } from '../utils/notifications';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized', code: 401 });
    }

    const connection = await pool.getConnection();
    await ensureNotificationsTable(connection);

    const [notifications] = await connection.query(
      'SELECT `id`, `title`, `message`, `type`, `read`, `createdAt` AS created_at, `updatedAt` AS updated_at ' +
      'FROM `notifications` ' +
      'WHERE `userId` = ? ' +
      'ORDER BY `createdAt` DESC',
      [authReq.user.id]
    );
    connection.release();

    res.json({ success: true, message: 'Notifications retrieved', code: 200, data: notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve notifications', code: 500 });
  }
});

router.get('/count', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized', code: 401 });
    }

    const connection = await pool.getConnection();
    await ensureNotificationsTable(connection);

    const [result] = await connection.query(
      'SELECT COUNT(*) AS count FROM `notifications` WHERE `userId` = ? AND `read` = 0',
      [authReq.user.id]
    );
    connection.release();

    const count = (result as any[])[0]?.count || 0;
    res.json({ success: true, message: 'Unread notification count retrieved', code: 200, data: { count } });
  } catch (error) {
    console.error('Get notification count error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve notification count', code: 500 });
  }
});

router.post('/:id/read', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized', code: 401 });
    }

    const notificationId = parseInt(req.params.id, 10);
    const connection = await pool.getConnection();
    await ensureNotificationsTable(connection);

    const [notifications] = await connection.query(
      'SELECT id, userId FROM notifications WHERE id = ?',
      [notificationId]
    );

    if ((notifications as any[]).length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Notification not found', code: 404 });
    }

    if ((notifications as any[])[0].userId !== authReq.user.id) {
      connection.release();
      return res.status(403).json({ success: false, message: 'Forbidden', code: 403 });
    }

    await connection.query('UPDATE `notifications` SET `read` = 1 WHERE `id` = ?', [notificationId]);
    connection.release();

    res.json({ success: true, message: 'Notification marked as read', code: 200 });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read', code: 500 });
  }
});

router.post('/read-all', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized', code: 401 });
    }

    const connection = await pool.getConnection();
    await ensureNotificationsTable(connection);
    await connection.query('UPDATE `notifications` SET `read` = 1 WHERE `userId` = ?', [authReq.user.id]);
    connection.release();

    res.json({ success: true, message: 'All notifications marked as read', code: 200 });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notifications as read', code: 500 });
  }
});

router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized', code: 401 });
    }

    const notificationId = parseInt(req.params.id, 10);
    const connection = await pool.getConnection();
    await ensureNotificationsTable(connection);

    const [notifications] = await connection.query(
      'SELECT id, userId FROM notifications WHERE id = ?',
      [notificationId]
    );

    if ((notifications as any[]).length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Notification not found', code: 404 });
    }

    if ((notifications as any[])[0].userId !== authReq.user.id) {
      connection.release();
      return res.status(403).json({ success: false, message: 'Forbidden', code: 403 });
    }

    await connection.query('DELETE FROM `notifications` WHERE `id` = ?', [notificationId]);
    connection.release();

    res.json({ success: true, message: 'Notification deleted', code: 200 });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notification', code: 500 });
  }
});

router.delete('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized', code: 401 });
    }

    const connection = await pool.getConnection();
    await ensureNotificationsTable(connection);
    await connection.query('DELETE FROM `notifications` WHERE `userId` = ?', [authReq.user.id]);
    connection.release();

    res.json({ success: true, message: 'All notifications deleted', code: 200 });
  } catch (error) {
    console.error('Delete all notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notifications', code: 500 });
  }
});

export default router;
