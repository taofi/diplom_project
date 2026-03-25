'use strict';

/**
 * Миграция: Добавление поля count в user_products и quantity в order_items
 * 
 * Поле count в user_products - общее количество единиц товара, купленных пользователем
 * Поле quantity в order_items - количество единиц товара в заказе
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Добавляем поле count в user_products
    await queryInterface.addColumn('user_products', 'count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Количество единиц товара, купленных пользователем'
    });

    // Добавляем поле quantity в order_items
    await queryInterface.addColumn('order_items', 'quantity', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Количество единиц товара в заказе'
    });
  },

  async down(queryInterface, Sequelize) {
    // Удаляем поле count из user_products
    await queryInterface.removeColumn('user_products', 'count');

    // Удаляем поле quantity из order_items
    await queryInterface.removeColumn('order_items', 'quantity');
  },
};
