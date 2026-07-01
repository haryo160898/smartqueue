// backend/src/routes/queues.ts

import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { AuthenticatedRequest, CreateQueueRequest, UpdateQueueStatusRequest } from '../types';
import { createNotification, createNotificationForAdmins } from '../utils/notifications';

const router = Router();

// Generate queue number
const generateQueueNumber = async (): Promise<string> => {
  const connection = await pool.getConnection();
  const [result] = await connection.query(
    'SELECT COUNT(*) as count FROM service_queues WHERE DATE(createdAt) = CURDATE()'
  );
  connection.release();

  const count = ((result as any[])[0].count || 0) + 1;
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  return `Q-${date}-${String(count).padStart(4, '0')}`;
};

// Get queues (user sees only own, admin sees all)
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        code: 401,
      });
    }

    const connection = await pool.getConnection();
    let query = `
      SELECT sq.id, sq.queueNumber AS queue_number, sq.userId AS user_id, sq.vehicleId AS vehicle_id, sq.complaint, sq.serviceDate AS service_date, sq.status, sq.createdAt AS created_at, sq.updatedAt AS updated_at, v.merk, v.tipe, v.tahun, v.platNomor AS plat_nomor, u.name as user_name
      FROM service_queues sq
      LEFT JOIN vehicles v ON sq.vehicleId = v.id
      LEFT JOIN users u ON sq.userId = u.id
    `;
    let params: any[] = [];

    // Only show own queues if not admin
    if (authReq.user!.role !== 'admin') {
      query += ' WHERE sq.userId = ?';
      params = [authReq.user!.id];
    }

    query += ' ORDER BY sq.createdAt DESC';

    const [queues] = await connection.query(query, params);
    connection.release();

    res.json({
      success: true,
      message: 'Queues retrieved',
      code: 200,
      data: queues,
    });
  } catch (error) {
    console.error('Get queues error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve queues',
      code: 500,
    });
  }
});

// Get queue detail
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        code: 401,
      });
    }

    const queueId = parseInt(req.params.id);

    const connection = await pool.getConnection();
    const [queues] = await connection.query(
      `SELECT sq.id, sq.queueNumber AS queue_number, sq.userId AS user_id, sq.vehicleId AS vehicle_id, sq.complaint, sq.serviceDate AS service_date, sq.status, sq.createdAt AS created_at, sq.updatedAt AS updated_at, v.merk, v.tipe, v.tahun, v.platNomor AS plat_nomor
       FROM service_queues sq
       LEFT JOIN vehicles v ON sq.vehicleId = v.id
       WHERE sq.id = ?`,
      [queueId]
    );

    if ((queues as any[]).length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Queue not found',
        code: 404,
      });
    }

    const queue = (queues as any[])[0];

    // Check authorization (user or admin)
    if (authReq.user!.role !== 'admin' && queue.user_id !== authReq.user!.id) {
      connection.release();
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
        code: 403,
      });
    }

    connection.release();

    res.json({
      success: true,
      message: 'Queue retrieved',
      code: 200,
      data: queue,
    });
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve queue',
      code: 500,
    });
  }
});

// Create queue
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        code: 401,
      });
    }

    const { vehicle_id, complaint, service_date }: CreateQueueRequest = req.body;

    if (!vehicle_id || !complaint || !service_date) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
        code: 400,
      });
    }

    const connection = await pool.getConnection();

    // Check vehicle ownership
    const [vehicles] = await connection.query(
      'SELECT userId AS user_id FROM vehicles WHERE id = ?',
      [vehicle_id]
    );

    if ((vehicles as any[]).length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
        code: 404,
      });
    }

    if ((vehicles as any[])[0].user_id !== authReq.user!.id) {
      connection.release();
      return res.status(403).json({
        success: false,
        message: 'Forbidden - vehicle does not belong to you',
        code: 403,
      });
    }

    const queueNumber = await generateQueueNumber();

    const [result] = await connection.query(
      'INSERT INTO service_queues (queueNumber, userId, vehicleId, complaint, serviceDate, status) VALUES (?, ?, ?, ?, ?, ?)',
      [queueNumber, authReq.user!.id, vehicle_id, complaint, service_date, 'Menunggu']
    );

    await createNotification(
      connection,
      authReq.user!.id,
      'Antrian berhasil dibuat',
      `Antrian ${queueNumber} berhasil dibuat untuk tanggal ${service_date}.`,
      'success'
    );
    await createNotificationForAdmins(
      connection,
      'Antrian baru masuk',
      `Antrian ${queueNumber} dibuat oleh pengguna.`,
      'info'
    );

    connection.release();

    res.status(201).json({
      success: true,
      message: 'Queue created successfully',
      code: 201,
      data: {
        id: (result as any).insertId,
        queue_number: queueNumber,
        user_id: authReq.user!.id,
        vehicle_id,
        complaint,
        service_date,
        status: 'Menunggu',
      },
    });
  } catch (error) {
    console.error('Create queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create queue',
      code: 500,
    });
  }
});

// Update queue status (admin only)
router.put(
  '/:id/status',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
          code: 401,
        });
      }

      const queueId = parseInt(req.params.id);
      const { status }: UpdateQueueStatusRequest = req.body;

      const validStatuses = ['Menunggu', 'Diproses', 'Selesai', 'Dibatalkan'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status',
          code: 400,
        });
      }

      const connection = await pool.getConnection();

      // Get old status
      const [queues] = await connection.query(
        'SELECT status, userId AS user_id, queueNumber AS queue_number FROM service_queues WHERE id = ?',
        [queueId]
      );

      if ((queues as any[]).length === 0) {
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'Queue not found',
          code: 404,
        });
      }

      const queue = (queues as any[])[0];
      const oldStatus = queue.status;

      // Update queue status
      await connection.query('UPDATE service_queues SET status = ? WHERE id = ?', [
        status,
        queueId,
      ]);

      // Notify queue owner about the status change
      const statusTitle =
        status === 'Selesai'
          ? 'Antrian selesai'
          : status === 'Diproses'
          ? 'Antrian diproses'
          : status === 'Dibatalkan'
          ? 'Antrian dibatalkan'
          : 'Status antrian diperbarui';
      const statusMessage =
        status === 'Selesai'
          ? `Antrian ${queue.queue_number} telah selesai.`
          : status === 'Diproses'
          ? `Antrian ${queue.queue_number} sedang diproses.`
          : status === 'Dibatalkan'
          ? `Antrian ${queue.queue_number} dibatalkan.`
          : `Status antrian ${queue.queue_number} diperbarui menjadi ${status}.`;

      await createNotification(
        connection,
        queue.user_id,
        statusTitle,
        statusMessage,
        status === 'Selesai' ? 'success' : status === 'Dibatalkan' ? 'warning' : 'info'
      );

      // If service has been completed, insert a service history record
      if (status === 'Selesai' && oldStatus !== 'Selesai') {
        const [columns] = await connection.query(
          "SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'service_history' AND column_name IN ('serviceNotes','service_notes') ORDER BY FIELD(column_name, 'serviceNotes', 'service_notes') LIMIT 1"
        );
        const serviceNotesColumn = (columns as any[]).length > 0 ? (columns as any[])[0].column_name : null;

        if (serviceNotesColumn) {
          await connection.query(
            `INSERT INTO service_history (queueId, \`${serviceNotesColumn}\`, completedAt) VALUES (?, ?, NOW())`,
            [queueId, null]
          );
        } else {
          await connection.query('INSERT INTO service_history (queueId, completedAt) VALUES (?, NOW())', [queueId]);
        }
      }

      // Log the change
      await connection.query(
        'INSERT INTO queue_logs (queueId, oldStatus, newStatus, changedBy) VALUES (?, ?, ?, ?)',
        [queueId, oldStatus, status, authReq.user!.id]
      );

      connection.release();

      res.json({
        success: true,
        message: 'Queue status updated',
        code: 200,
        data: {
          id: queueId,
          old_status: oldStatus,
          new_status: status,
        },
      });
    } catch (error) {
      console.error('Update queue status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update queue status',
        code: 500,
      });
    }
  }
);

// Cancel queue
router.put('/:id/cancel', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        code: 401,
      });
    }

    const queueId = parseInt(req.params.id);

    const connection = await pool.getConnection();

    const [queues] = await connection.query(
      'SELECT userId AS user_id, status, queueNumber AS queue_number FROM service_queues WHERE id = ?',
      [queueId]
    );

    if ((queues as any[]).length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Queue not found',
        code: 404,
      });
    }

    const queue = (queues as any[])[0];

    // Check authorization
    if (authReq.user!.role !== 'admin' && queue.user_id !== authReq.user!.id) {
      connection.release();
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
        code: 403,
      });
    }

    const oldStatus = queue.status;

    await connection.query('UPDATE service_queues SET status = ? WHERE id = ?', [
      'Dibatalkan',
      queueId,
    ]);

    await connection.query(
      'INSERT INTO queue_logs (queueId, oldStatus, newStatus, changedBy) VALUES (?, ?, ?, ?)',
      [queueId, oldStatus, 'Dibatalkan', authReq.user!.id]
    );

    await createNotification(
      connection,
      queue.user_id,
      'Antrian dibatalkan',
      authReq.user!.role === 'admin'
        ? `Antrian ${queue.queue_number || queueId} dibatalkan oleh admin.`
        : `Antrian ${queue.queue_number || queueId} dibatalkan.`,
      'warning'
    );

    if (authReq.user!.role !== 'admin') {
      await createNotificationForAdmins(
        connection,
        'Antrian dibatalkan oleh pengguna',
        `Pengguna membatalkan antrian ${queue.queue_number || queueId}.`,
        'warning'
      );
    }

    connection.release();

    res.json({
      success: true,
      message: 'Queue cancelled',
      code: 200,
    });
  } catch (error) {
    console.error('Cancel queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel queue',
      code: 500,
    });
  }
});

export default router;
