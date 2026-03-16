'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Get products
      const [products] = await queryInterface.sequelize.query(
        `SELECT id, main_image FROM products ORDER BY id`,
        { transaction }
      );

      for (const product of products) {
        // Add product media (main image)
        await queryInterface.sequelize.query(
          `INSERT INTO product_media (product_id, media_type, url, sort_order, is_cover) 
           VALUES (${product.id}, 'image', '${product.main_image}', 0, true)`,
          { transaction }
        );
      }

      await transaction.commit();
      console.log('Product media seeded successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('Error seeding product media:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('product_media', null, {});
  },
};
