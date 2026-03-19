'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const now = new Date();
    
    try {
      // Get product IDs
      const [products] = await queryInterface.sequelize.query(
        `SELECT id, name, description FROM products ORDER BY id`,
        { transaction }
      );

      for (const product of products) {
        const name = product.name || 'Unnamed Product';
        const description = product.description || '';
        const shortDescription = name.substring(0, 50) + '...';
        
        // Add Russian translation
        await queryInterface.sequelize.query(
          `INSERT INTO product_translations (name, description, short_description, product_id, language, created_at, updated_at) 
           VALUES ('${name.replace(/'/g, "''")}', '${description.replace(/'/g, "''")}', '${shortDescription.replace(/'/g, "''")}', ${product.id}, 'ru', '${now.toISOString()}', '${now.toISOString()}')`,
          { transaction }
        );

        // Add English translation
        await queryInterface.sequelize.query(
          `INSERT INTO product_translations (name, description, short_description, product_id, language, created_at, updated_at) 
           VALUES ('${name.replace(/'/g, "''")}', '${description.replace(/'/g, "''")}', '${shortDescription.replace(/'/g, "''")}', ${product.id}, 'en', '${now.toISOString()}', '${now.toISOString()}')`,
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
