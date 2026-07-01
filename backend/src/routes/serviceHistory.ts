import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { AuthenticatedRequest, CreateServiceHistoryRequest } from '../types';

const router = Router();

const getServiceNotesColumnName = async (connection: any): Promise<string | null> => {
  const [columns] = await connection.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'service_history' AND column_name IN ('serviceNotes','service_notes') ORDER BY FIELD(column_name, 'serviceNotes', 'service_notes') LIMIT 1"
  );
  return (columns as any[]).length > 0 ? (columns as any[])[0].column_name : null;
};

// Get service history records
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized', code: 401 });
    }

    const connection = await pool.getConnection();
    const serviceNotesColumn = await getServiceNotesColumnName(connection);
    const serviceNotesSupported = Boolean(serviceNotesColumn);
    const serviceNotesSelect = serviceNotesColumn ? `sh.\`${serviceNotesColumn}\` AS service_notes, ` : '';
    let query = `
      SELECT sh.id, sh.queueId AS queue_id, ${serviceNotesSelect}sh.completedAt AS completed_at, sh.createdAt AS created_at, sq.queueNumber AS queue_number, sq.userId AS user_id, sq.complaint AS complaint, u.name AS user_name, v.merk, v.tipe, v.tahun, v.platNomor AS plat_nomor
      FROM service_history sh
      JOIN service_queues sq ON sh.queueId = sq.id
      LEFT JOIN users u ON sq.userId = u.id
      LEFT JOIN vehicles v ON sq.vehicleId = v.id
    `;
    const params: any[] = [];

    if (authReq.user.role !== 'admin') {
      query += ' WHERE sq.userId = ?';
      params.push(authReq.user.id);
    }

    query += ' ORDER BY sh.completedAt DESC';

    const [history] = await connection.query(query, params);
    connection.release();

    res.json({
      success: true,
      message: 'Service history retrieved',
      code: 200,
      data: history,
      meta: { service_notes_supported: serviceNotesSupported },
    });
  } catch (error) {
    console.error('Get service history error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve service history', code: 500 });
  }
});

// Get history for a specific queue
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

    const serviceNotesColumn = await getServiceNotesColumnName(connection);
    const serviceNotesSupported = Boolean(serviceNotesColumn);
    const serviceNotesSelect = serviceNotesColumn ? `, \`${serviceNotesColumn}\` AS service_notes` : '';
    const [history] = await connection.query(
      `SELECT id, queueId AS queue_id${serviceNotesSelect}, completedAt AS completed_at, createdAt AS created_at FROM service_history WHERE queueId = ? ORDER BY completedAt DESC`,
      [queueId]
    );

    connection.release();

    res.json({
      success: true,
      message: 'Queue history retrieved',
      code: 200,
      data: history,
      meta: { service_notes_supported: serviceNotesSupported },
    });
  } catch (error) {
    console.error('Get queue history error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve queue history', code: 500 });
  }
});

// Add service history and mark queue completed
router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { queue_id, service_notes }: CreateServiceHistoryRequest = req.body;

    if (!queue_id) {
      return res.status(400).json({ success: false, message: 'Queue ID is required', code: 400 });
    }

    const connection = await pool.getConnection();
    const [queues] = await connection.query('SELECT status FROM service_queues WHERE id = ?', [queue_id]);

    if ((queues as any[]).length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Queue not found', code: 404 });
    }

    const oldStatus = (queues as any[])[0].status;
    const serviceNotesColumn = await getServiceNotesColumnName(connection);

    if (serviceNotesColumn) {
      await connection.query(
        `INSERT INTO service_history (queueId, \`${serviceNotesColumn}\`, completedAt) VALUES (?, ?, NOW())`,
        [queue_id, service_notes || null]
      );
    } else {
      await connection.query('INSERT INTO service_history (queueId, completedAt) VALUES (?, NOW())', [queue_id]);
    }

    if (oldStatus !== 'Selesai') {
      await connection.query('UPDATE service_queues SET status = ? WHERE id = ?', ['Selesai', queue_id]);
      await connection.query(
        'INSERT INTO queue_logs (queueId, oldStatus, newStatus, changedBy) VALUES (?, ?, ?, ?)',
        [queue_id, oldStatus, 'Selesai', authReq.user!.id]
      );
    }

    connection.release();

    res.status(201).json({ success: true, message: 'Service history created', code: 201 });
  } catch (error) {
    console.error('Create service history error:', error);
    res.status(500).json({ success: false, message: 'Failed to create service history', code: 500 });
  }
});

export default router;
