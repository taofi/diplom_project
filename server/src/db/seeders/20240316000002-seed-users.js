'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const now = new Date();
    
    try {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      // Create seller 1
      await queryInterface.sequelize.query(
        `INSERT INTO users (email, password_hash, name, avatar_url, role, locale, created_at, updated_at) 
         VALUES ('seller1@example.com', '${hashedPassword}', 'Demo Seller 1', NULL, '["admin, author"]', 'ru', '${now.toISOString()}', '${now.toISOString()}')`,
        { transaction }
      );

      // Create seller 2
      await queryInterface.sequelize.query(
        `INSERT INTO users (email, password_hash, name, avatar_url, role, locale, created_at, updated_at) 
         VALUES ('seller2@example.com', '${hashedPassword}', 'Demo Seller 2', NULL, '["author"]', 'en', '${now.toISOString()}', '${now.toISOString()}')`,
        { transaction }
      );

      await transaction.commit();
      console.log('Users (sellers) seeded successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('Error seeding users:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', { email: ['seller1@example.com', 'seller2@example.com'] }, {});
  },
};
