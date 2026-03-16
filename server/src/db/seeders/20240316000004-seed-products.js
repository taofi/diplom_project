'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Get seller IDs
      const [seller1Result] = await queryInterface.sequelize.query(
        `SELECT id FROM users WHERE email = 'seller1@example.com' LIMIT 1`,
        { transaction }
      );
      const seller1Id = seller1Result[0].id;

      const [seller2Result] = await queryInterface.sequelize.query(
        `SELECT id FROM users WHERE email = 'seller2@example.com' LIMIT 1`,
        { transaction }
      );
      const seller2Id = seller2Result[0].id;

      // Create product 1: Watercolor Brush Set
      await queryInterface.sequelize.query(
        `INSERT INTO products (seller_id, type, file_url, price, discount_price, stock, is_featured, main_image, is_active, created_at, updated_at) 
         VALUES (${seller1Id}, 'brush', 'https://example.com/files/brush1.abr', 29.99, 19.99, 100, true, 'https://example.com/images/brush1.png', true, NOW(), NOW())`,
        { transaction }
      );

      // Create product 2: Fantasy Character Illustration
      await queryInterface.sequelize.query(
        `INSERT INTO products (seller_id, type, file_url, price, discount_price, stock, is_featured, main_image, is_active, created_at, updated_at) 
         VALUES (${seller1Id}, 'illustration', 'https://example.com/files/illust1.png', 49.99, NULL, 50, false, 'https://example.com/images/illust1.png', true, NOW(), NOW())`,
        { transaction }
      );

      // Create product 3: Ink Brush Collection
      await queryInterface.sequelize.query(
        `INSERT INTO products (seller_id, type, file_url, price, discount_price, stock, is_featured, main_image, is_active, created_at, updated_at) 
         VALUES (${seller2Id}, 'brush', 'https://example.com/files/brush2.abr', 39.99, 29.99, 75, true, 'https://example.com/images/brush2.png', true, NOW(), NOW())`,
        { transaction }
      );

      // Create product 4: Portrait Illustration
      await queryInterface.sequelize.query(
        `INSERT INTO products (seller_id, type, file_url, price, discount_price, stock, is_featured, main_image, is_active, created_at, updated_at) 
         VALUES (${seller2Id}, 'illustration', 'https://example.com/files/illust2.png', 79.99, NULL, 20, false, 'https://example.com/images/illust2.png', true, NOW(), NOW())`,
        { transaction }
      );

      await transaction.commit();
      console.log('Products seeded successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('Error seeding products:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('products', null, {});
  },
};
