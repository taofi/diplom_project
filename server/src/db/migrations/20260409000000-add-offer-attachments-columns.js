'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('offers', 'creator_attachments_urls', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'JSON array of customer attachment URLs',
    });

    await queryInterface.addColumn('offers', 'author_images_urls', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'JSON array of executor image URLs',
    });

    await queryInterface.addColumn('offers', 'author_file_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'Executor single document URL',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('offers', 'author_file_url');
    await queryInterface.removeColumn('offers', 'author_images_urls');
    await queryInterface.removeColumn('offers', 'creator_attachments_urls');
  },
};
