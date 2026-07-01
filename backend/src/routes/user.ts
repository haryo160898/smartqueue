import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authMiddleware } from '../middleware/auth';
import {
  AuthenticatedRequest,
  UpdateUserProfileRequest,
  UpdateUserSettingsRequest,
} from '../types';

const router = Router();

const ensureUserSettingsTable = async (connection: any) => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS user_settings (
      id int(11) NOT NULL AUTO_INCREMENT,
      userId int(11) NOT NULL,
      emailNotifications tinyint(1) NOT NULL DEFAULT 1,
      smsNotifications tinyint(1) NOT NULL DEFAULT 0,
      queueUpdates tinyint(1) NOT NULL DEFAULT 1,
      maintenanceReminders tinyint(1) NOT NULL DEFAULT 1,
      systemUpdates tinyint(1) NOT NULL DEFAULT 1,
      createdAt datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY userId (userId),
      CONSTRAINT user_settings_ibfk_1 FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
};

router.get('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized', code: 401 });
    }

    const connection = await pool.getConnection();

    const [users] = await connection.query(
      'SELECT id, name, email, role, createdAt AS created_at, updatedAt AS updated_at FROM users WHERE id = ?',
      [authReq.user.id]
    );
    connection.release();

    if ((users as any[]).length === 0) {
      return res.status(404).json({ success: false, message: 'User not found', code: 404 });
    }

    res.json({ success: true, message: 'User profile retrieved', code: 200, data: (users as any[])[0] });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve user profile', code: 500 });
  }
});

router.put('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized', code: 401 });
    }

    const { name, email, phone, address }: UpdateUserProfileRequest = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required', code: 400 });
    }

    const connection = await pool.getConnection();

    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, authReq.user.id]
    );

    if ((existingUsers as any[]).length > 0) {
      connection.release();
      return res.status(400).json({ success: false, message: 'Email already registered', code: 400 });
    }

    await connection.query(
      'UPDATE users SET name = ?, email = ?, updatedAt = NOW() WHERE id = ?',
      [name, email, authReq.user.id]
    );

    const [updatedUsers] = await connection.query(
      'SELECT id, name, email, role, createdAt AS created_at, updatedAt AS updated_at FROM users WHERE id = ?',
      [authReq.user.id]
    );

    connection.release();

    res.json({ success: true, message: 'User profile updated', code: 200, data: (updatedUsers as any[])[0] });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile', code: 500 });
  }
});

router.get('/settings', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized', code: 401 });
    }

    const connection = await pool.getConnection();
    await ensureUserSettingsTable(connection);

    const [settings] = await connection.query(
      'SELECT emailNotifications, smsNotifications, queueUpdates, maintenanceReminders, systemUpdates, createdAt AS created_at, updatedAt AS updated_at FROM user_settings WHERE userId = ?',
      [authReq.user.id]
    );

    if ((settings as any[]).length === 0) {
      await connection.query(
        'INSERT INTO user_settings (userId) VALUES (?)',
        [authReq.user.id]
      );

      const [insertedSettings] = await connection.query(
        'SELECT emailNotifications, smsNotifications, queueUpdates, maintenanceReminders, systemUpdates, createdAt AS created_at, updatedAt AS updated_at FROM user_settings WHERE userId = ?',
        [authReq.user.id]
      );

      connection.release();
      return res.json({ success: true, message: 'User settings retrieved', code: 200, data: (insertedSettings as any[])[0] });
    }

    connection.release();
    res.json({ success: true, message: 'User settings retrieved', code: 200, data: (settings as any[])[0] });
  } catch (error) {
    console.error('Get user settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve user settings', code: 500 });
  }
});

router.put('/settings', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized', code: 401 });
    }

    const {
      emailNotifications,
      smsNotifications,
      queueUpdates,
      maintenanceReminders,
      systemUpdates,
    }: UpdateUserSettingsRequest = req.body;

    const connection = await pool.getConnection();
    await ensureUserSettingsTable(connection);

    const [existing] = await connection.query(
      'SELECT id FROM user_settings WHERE userId = ?',
      [authReq.user.id]
    );

    if ((existing as any[]).length === 0) {
      await connection.query(
        'INSERT INTO user_settings (userId, emailNotifications, smsNotifications, queueUpdates, maintenanceReminders, systemUpdates) VALUES (?, ?, ?, ?, ?, ?)',
        [
          authReq.user.id,
          emailNotifications ? 1 : 0,
          smsNotifications ? 1 : 0,
          queueUpdates ? 1 : 0,
          maintenanceReminders ? 1 : 0,
          systemUpdates ? 1 : 0,
        ]
      );
    } else {
      await connection.query(
        'UPDATE user_settings SET emailNotifications = ?, smsNotifications = ?, queueUpdates = ?, maintenanceReminders = ?, systemUpdates = ? WHERE userId = ?',
        [
          emailNotifications ? 1 : 0,
          smsNotifications ? 1 : 0,
          queueUpdates ? 1 : 0,
          maintenanceReminders ? 1 : 0,
          systemUpdates ? 1 : 0,
          authReq.user.id,
        ]
      );
    }

    const [updatedSettings] = await connection.query(
      'SELECT emailNotifications, smsNotifications, queueUpdates, maintenanceReminders, systemUpdates, createdAt AS created_at, updatedAt AS updated_at FROM user_settings WHERE userId = ?',
      [authReq.user.id]
    );

    connection.release();

    res.json({ success: true, message: 'User settings updated', code: 200, data: (updatedSettings as any[])[0] });
  } catch (error) {
    console.error('Update user settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user settings', code: 500 });
  }
});

export default router;
