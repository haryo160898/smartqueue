import { PoolConnection } from 'mysql2/promise';

export const ensureNotificationsTable = async (connection: PoolConnection) => {
  await connection.query(
    'CREATE TABLE IF NOT EXISTS `notifications` (' +
    '`id` int(11) NOT NULL AUTO_INCREMENT,' +
    '`userId` int(11) NOT NULL,' +
    '`title` varchar(255) NOT NULL,' +
    '`message` text NOT NULL,' +
    '`type` enum(' +
    "'info','success','warning','error'" +
    ') NOT NULL DEFAULT ' +
    "'info'" +
    ',' +
    '`read` tinyint(1) NOT NULL DEFAULT 0,' +
    '`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),' +
    '`updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),' +
    'PRIMARY KEY (`id`),' +
    'KEY `userId` (`userId`),' +
    'CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;'
  );
};

export const createNotification = async (
  connection: PoolConnection,
  userId: number,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
) => {
  await ensureNotificationsTable(connection);
  await connection.query(
    'INSERT INTO `notifications` (`userId`, `title`, `message`, `type`) VALUES (?, ?, ?, ?)',
    [userId, title, message, type]
  );
};

export const createNotificationForAdmins = async (
  connection: PoolConnection,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
) => {
  await ensureNotificationsTable(connection);
  const [admins] = await connection.query('SELECT id FROM users WHERE role = ?', ['admin']);
  const adminUsers = admins as any[];

  if (adminUsers.length === 0) {
    return;
  }

  const placeholders: string[] = [];
  const values: any[] = [];

  adminUsers.forEach((admin) => {
    placeholders.push('(?, ?, ?, ?)');
    values.push(admin.id, title, message, type);
  });

  await connection.query(
    `INSERT INTO \`notifications\` (\`userId\`, \`title\`, \`message\`, \`type\`) VALUES ${placeholders.join(', ')}`,
    values
  );
};
