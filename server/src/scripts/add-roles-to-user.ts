/**
 * Скрипт для добавления ролей пользователю с ID 6
 * Запуск: npx ts-node src/scripts/add-roles-to-user.ts
 */
import { Sequelize } from 'sequelize-typescript';
import { config } from 'dotenv';

config();

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'diplom_project',
  logging: false,
});

async function addRolesToUser6() {
  const userId = 6;
  const roles = ['admin', 'user']; // роли для пользователя 6

  try {
    await sequelize.authenticate();
    console.log('Подключение к БД установлено');

    // Удаляем старые роли если есть
    await sequelize.query(`DELETE FROM user_roles WHERE user_id = ${userId}`);
    console.log('Старые роли удалены');

    // Добавляем новые роли
    for (const role of roles) {
      await sequelize.query(
        `INSERT INTO user_roles (user_id, role, created_at, updated_at) VALUES (${userId}, '${role}', NOW(), NOW())`
      );
      console.log(`Роль '${role}' добавлена`);
    }

    console.log(`\nГотово! Пользователю с ID ${userId} назначены роли: ${roles.join(', ')}`);
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await sequelize.close();
  }
}

addRolesToUser6();