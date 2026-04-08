'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'description', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Profile description',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'description');
  },
};
