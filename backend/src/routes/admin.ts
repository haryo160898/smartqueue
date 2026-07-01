// backend/src/routes/admin.ts

import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

const ensureUserProfileColumns = async (connection: any) => {
  await connection.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS phone VARCHAR(50) NULL,
      ADD COLUMN IF NOT EXISTS address VARCHAR(255) NULL
  `);
};

// GET /api/admin/stats
router.get('/stats', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const connection = await pool.getConnection();

    const [[usersCount]] = (await connection.query('SELECT COUNT(*) as count FROM users')) as any;
    const [[vehiclesCount]] = (await connection.query('SELECT COUNT(*) as count FROM vehicles')) as any;
    const [[queuesTodayCount]] = (await connection.query('SELECT COUNT(*) as count FROM service_queues WHERE DATE(serviceDate) = CURDATE()')) as any;
    const [[completedCount]] = (await connection.query('SELECT COUNT(*) as count FROM service_history WHERE completedAt IS NOT NULL')) as any;
    const [[pendingCount]] = (await connection.query('SELECT COUNT(*) as count FROM service_queues WHERE status = \'Menunggu\'')) as any;
    const [[processingCount]] = (await connection.query('SELECT COUNT(*) as count FROM service_queues WHERE status = \'Diproses\'')) as any;

    // Monthly data for the last 6 months
    const [queuesByMonthRows] = (await connection.query(
      `SELECT DATE_FORMAT(serviceDate, '%b %Y') as month, COUNT(*) as queues
       FROM service_queues
       WHERE serviceDate >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
       GROUP BY YEAR(serviceDate), MONTH(serviceDate)
       ORDER BY YEAR(serviceDate), MONTH(serviceDate)`
    )) as any;

    const [completedByMonthRows] = (await connection.query(
      `SELECT DATE_FORMAT(completedAt, '%b %Y') as month, COUNT(*) as completed
       FROM service_history
       WHERE completedAt >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
       GROUP BY YEAR(completedAt), MONTH(completedAt)
       ORDER BY YEAR(completedAt), MONTH(completedAt)`
    )) as any;

    connection.release();

    // Merge monthly data into an array of { month, queues, completed }
    const monthsMap: Record<string, any> = {};
    (queuesByMonthRows as any[]).forEach((r) => {
      monthsMap[r.month] = { month: r.month, queues: r.queues || 0, completed: 0 };
    });
    (completedByMonthRows as any[]).forEach((r) => {
      monthsMap[r.month] = monthsMap[r.month] || { month: r.month, queues: 0, completed: 0 };
      monthsMap[r.month].completed = r.completed || 0;
    });

    const monthlyData = Object.values(monthsMap);

    res.json({
      success: true,
      data: {
        totalUsers: (usersCount as any).count || 0,
        totalVehicles: (vehiclesCount as any).count || 0,
        totalQueuestoday: (queuesTodayCount as any).count || 0,
        totalCompletedServices: (completedCount as any).count || 0,
        totalPendingQueues: (pendingCount as any).count || 0,
        totalProcessingQueues: (processingCount as any).count || 0,
        monthlyData,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve stats' });
  }
});

// GET /api/admin/users - list all users (admin)
router.get('/users', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const connection = await pool.getConnection();
    await ensureUserProfileColumns(connection);
    const [users] = await connection.query(
      'SELECT id, name, email, role, phone, address, createdAt AS created_at FROM users ORDER BY createdAt DESC'
    );
    connection.release();
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve users' });
  }
});

// GET /api/admin/vehicles - list all vehicles (admin)
router.get('/vehicles', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const connection = await pool.getConnection();
    const [vehicles] = await connection.query(
      `SELECT v.id, v.userId AS user_id, v.merk, v.tipe, v.tahun, v.platNomor AS plat_nomor, v.createdAt AS created_at, u.name as user_name
       FROM vehicles v
       LEFT JOIN users u ON v.userId = u.id
       ORDER BY v.createdAt DESC`
    );
    connection.release();
    res.json({ success: true, data: vehicles });
  } catch (error) {
    console.error('Admin vehicles error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve vehicles' });
  }
});

export default router;

