'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Create license type: Individual
      const [licenseType1] = await queryInterface.sequelize.query(
        `INSERT INTO license_types (slug) VALUES ('individual') RETURNING id`,
        { transaction }
      );
      const licenseType1Id = licenseType1[0].id;

      // Create license type: Commercial
      const [licenseType2] = await queryInterface.sequelize.query(
        `INSERT INTO license_types (slug) VALUES ('commercial') RETURNING id`,
        { transaction }
      );
      const licenseType2Id = licenseType2[0].id;

      // Create license type: Extended
      const [licenseType3] = await queryInterface.sequelize.query(
        `INSERT INTO license_types (slug) VALUES ('extended') RETURNING id`,
        { transaction }
      );
      const licenseType3Id = licenseType3[0].id;

      // Create license type translations for Individual
      await queryInterface.sequelize.query(
        `INSERT INTO license_type_translations (license_type_id, locale, name, description) 
         VALUES (${licenseType1Id}, 'ru', 'Персональная', 'Для личного использования')`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `INSERT INTO license_type_translations (license_type_id, locale, name, description) 
         VALUES (${licenseType1Id}, 'en', 'Personal', 'For personal use')`,
        { transaction }
      );

      // Create license type translations for Commercial
      await queryInterface.sequelize.query(
        `INSERT INTO license_type_translations (license_type_id, locale, name, description) 
         VALUES (${licenseType2Id}, 'ru', 'Коммерческая', 'Для коммерческого использования')`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `INSERT INTO license_type_translations (license_type_id, locale, name, description) 
         VALUES (${licenseType2Id}, 'en', 'Commercial', 'For commercial use')`,
        { transaction }
      );

      // Create license type translations for Extended
      await queryInterface.sequelize.query(
        `INSERT INTO license_type_translations (license_type_id, locale, name, description) 
         VALUES (${licenseType3Id}, 'ru', 'Расширенная', 'Для расширенного коммерческого использования')`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `INSERT INTO license_type_translations (license_type_id, locale, name, description) 
         VALUES (${licenseType3Id}, 'en', 'Extended', 'For extended commercial use')`,
        { transaction }
      );

      await transaction.commit();
      console.log('License types seeded successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('Error seeding license types:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('license_type_translations', null, {});
    await queryInterface.bulkDelete('license_types', null, {});
  },
};
