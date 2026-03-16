'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Get categories
      const [categories] = await queryInterface.sequelize.query(
        `SELECT id FROM categories ORDER BY id`,
        { transaction }
      );

      // Get products
      const [products] = await queryInterface.sequelize.query(
        `SELECT id, type FROM products ORDER BY id`,
        { transaction }
      );

      // Map product types to category IDs
      // Category 1 = brushes, Category 2 = illustrations
      const typeToCategoryId = {
        'brush': categories[0].id,
        'illustration': categories[1].id,
      };

      // Create product categories
      for (const product of products) {
        const categoryId = typeToCategoryId[product.type];
        if (categoryId) {
          await queryInterface.sequelize.query(
            `INSERT INTO product_categories (product_id, category_id) 
             VALUES (${product.id}, ${categoryId})`,
            { transaction }
          );
        }
      }

      await transaction.commit();
      console.log('Product categories seeded successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('Error seeding product categories:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('product_categories', null, {});
  },
};
