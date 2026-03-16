'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Create categories
      const [category1] = await queryInterface.sequelize.query(
        `INSERT INTO categories DEFAULT VALUES RETURNING id`,
        { transaction }
      );
      const category1Id = category1[0].id;

      const [category2] = await queryInterface.sequelize.query(
        `INSERT INTO categories DEFAULT VALUES RETURNING id`,
        { transaction }
      );
      const category2Id = category2[0].id;

      // Create category translations
      await queryInterface.sequelize.query(
        `INSERT INTO category_translations (category_id, locale, name) 
         VALUES (${category1Id}, 'ru', 'Кисти')`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `INSERT INTO category_translations (category_id, locale, name) 
         VALUES (${category1Id}, 'en', 'Brushes')`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `INSERT INTO category_translations (category_id, locale, name) 
         VALUES (${category2Id}, 'ru', 'Иллюстрации')`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `INSERT INTO category_translations (category_id, locale, name) 
         VALUES (${category2Id}, 'en', 'Illustrations')`,
        { transaction }
      );

      await transaction.commit();
      console.log('Categories seeded successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('Error seeding categories:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('category_translations', null, {});
    await queryInterface.bulkDelete('categories', null, {});
  },
};
