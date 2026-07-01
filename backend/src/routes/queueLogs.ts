import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

// Get all queue logs
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized', code: 401 });
    }

    const connection = await pool.getConnection();
    let query = `
      SELECT ql.id, ql.queueId AS queue_id, ql.oldStatus AS old_status, ql.newStatus AS new_status, ql.changedBy AS changed_by, ql.changedAt AS changed_at, sq.queueNumber AS queue_number, sq.userId AS user_id, u.name AS changed_by_name
      FROM queue_logs ql
      JOIN service_queues sq ON ql.queueId = sq.id
      LEFT JOIN users u ON ql.changedBy = u.id
    `;
    const params: any[] = [];

    if (authReq.user.role !== 'admin') {
      query += ' WHERE sq.userId = ?';
      params.push(authReq.user.id);
    }

    query += ' ORDER BY ql.changedAt DESC';

    const [logs] = await connection.query(query, params);
    connection.release();

    res.json({ success: true, message: 'Queue logs retrieved', code: 200, data: logs });
  } catch (error) {
    console.error('Get queue logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve queue logs', code: 500 });
  }
});

// Get logs for a specific queue
router.get('/queue/:queueId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized', code: 401 });
    }

    const queueId = parseInt(req.params.queueId, 10);
    const connection = await pool.getConnection();
    const [queues] = await connection.query('SELECT userId AS user_id FROM service_queues WHERE id = ?', [queueId]);

    if ((queues as any[]).length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Queue not found', code: 404 });
    }

    const queue = (queues as any[])[0];
    if (authReq.user.role !== 'admin' && queue.user_id !== authReq.user.id) {
      connection.release();
      return res.status(403).json({ success: false, message: 'Forbidden', code: 403 });
    }

    const [logs] = await connection.query(
      'SELECT ql.id, ql.queueId AS queue_id, ql.oldStatus AS old_status, ql.newStatus AS new_status, ql.changedBy AS changed_by, ql.changedAt AS changed_at, u.name AS changed_by_name FROM queue_logs ql LEFT JOIN users u ON ql.changedBy = u.id WHERE ql.queueId = ? ORDER BY ql.changedAt DESC',
      [queueId]
    );

    connection.release();

    res.json({ success: true, message: 'Queue logs retrieved', code: 200, data: logs });
  } catch (error) {
    console.error('Get queue logs by queue error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve queue logs', code: 500 });
  }
});

export default router;
