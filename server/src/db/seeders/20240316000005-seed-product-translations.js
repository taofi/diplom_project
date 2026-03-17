'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Get product IDs
      const [products] = await queryInterface.sequelize.query(
        `SELECT id, name, description FROM products ORDER BY id`,
        { transaction }
      );

      for (const product of products) {
        const name = product.name || 'Unnamed Product';
        const description = product.description || '';
        
        // Add Russian translation
        await queryInterface.sequelize.query(
          `INSERT INTO product_translations (name, description, productId, language) 
           VALUES ('${name.replace(/'/g, "''")}', '${description.replace(/'/g, "''")}', ${product.id}, 'ru')`,
          { transaction }
        );

        // Add English translation
        await queryInterface.sequelize.query(
          `INSERT INTO product_translations (name, description, productId, language) 
           VALUES ('${name.replace(/'/g, "''")}', '${description.replace(/'/g, "''")}', ${product.id}, 'en')`,
          { transaction }
        );
      }

      await transaction.commit();
      console.log('Product translations seeded successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('Error seeding product translations:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('product_translations', null, {});
  },
};
