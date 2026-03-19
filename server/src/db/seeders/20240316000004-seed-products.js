'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const now = new Date();
    
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
        `INSERT INTO products (seller_id, type, file_url, name, description, price, discount_price, sku, stock, is_featured, main_image, is_active, created_at, updated_at) 
         VALUES (${seller1Id}, 'brush', 'https://example.com/files/brush1.abr', 'Watercolor Brush Set', 'Professional watercolor brush set for digital artists. Includes 12 high-quality brushes.', 29.99, 19.99, 'BRUSH-001', 100, true, 'https://example.com/images/brush1.png', true, '${now.toISOString()}', '${now.toISOString()}')`,
        { transaction }
      );

      // Create product 2: Fantasy Character Illustration
      await queryInterface.sequelize.query(
        `INSERT INTO products (seller_id, type, file_url, name, description, price, discount_price, sku, stock, is_featured, main_image, is_active, created_at, updated_at) 
         VALUES (${seller1Id}, 'illustration', 'https://example.com/files/illust1.png', 'Fantasy Character Illustration', 'Beautiful fantasy character illustration in high resolution. Perfect for your projects.', 49.99, NULL, 'ILLUST-001', 50, false, 'https://example.com/images/illust1.png', true, '${now.toISOString()}', '${now.toISOString()}')`,
        { transaction }
      );

      // Create product 3: Ink Brush Collection
      await queryInterface.sequelize.query(
        `INSERT INTO products (seller_id, type, file_url, name, description, price, discount_price, sku, stock, is_featured, main_image, is_active, created_at, updated_at) 
         VALUES (${seller2Id}, 'brush', 'https://example.com/files/brush2.abr', 'Ink Brush Collection', 'Premium ink brush collection for Procreate and Photoshop. 20 unique brushes.', 39.99, 29.99, 'BRUSH-002', 75, true, 'https://example.com/images/brush2.png', true, '${now.toISOString()}', '${now.toISOString()}')`,
        { transaction }
      );

      // Create product 4: Portrait Illustration
      await queryInterface.sequelize.query(
        `INSERT INTO products (seller_id, type, file_url, name, description, price, discount_price, sku, stock, is_featured, main_image, is_active, created_at, updated_at) 
         VALUES (${seller2Id}, 'illustration', 'https://example.com/files/illust2.png', 'Portrait Illustration', 'Custom portrait illustration in your preferred style. Includes source files.', 79.99, NULL, 'ILLUST-002', 20, false, 'https://example.com/images/illust2.png', true, '${now.toISOString()}', '${now.toISOString()}')`,
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
