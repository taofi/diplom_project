'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.removeColumn('product_translations', 'productId');
  },

  async down(queryInterface, Sequelize) {
    // Добавляем колонку обратно
    await queryInterface.addColumn('product_translations', 'productId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
    });
  },
};
