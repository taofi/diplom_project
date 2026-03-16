'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Get products
      const [products] = await queryInterface.sequelize.query(
        `SELECT id, price FROM products ORDER BY id`,
        { transaction }
      );

      // Get license types
      const [licenseTypes] = await queryInterface.sequelize.query(
        `SELECT id, slug FROM license_types ORDER BY id`,
        { transaction }
      );

      const licenseTypeMap = {};
      for (const lt of licenseTypes) {
        licenseTypeMap[lt.slug] = lt.id;
      }

      // Create product licenses for each product
      for (const product of products) {
        // Individual license - base price
        await queryInterface.sequelize.query(
          `INSERT INTO product_licenses (product_id, license_type_id, price) 
           VALUES (${product.id}, ${licenseTypeMap['individual']}, ${product.price})`,
          { transaction }
        );

        // Commercial license - 2x price
        await queryInterface.sequelize.query(
          `INSERT INTO product_licenses (product_id, license_type_id, price) 
           VALUES (${product.id}, ${licenseTypeMap['commercial']}, ${product.price * 2})`,
          { transaction }
        );

        // Extended license - 5x price
        await queryInterface.sequelize.query(
          `INSERT INTO product_licenses (product_id, license_type_id, price) 
           VALUES (${product.id}, ${licenseTypeMap['extended']}, ${product.price * 5})`,
          { transaction }
        );
      }

      await transaction.commit();
      console.log('Product licenses seeded successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('Error seeding product licenses:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('product_licenses', null, {});
  },
};
