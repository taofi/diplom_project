'use strict';

module.exports = {
  /**
   * Миграция: Перенос name, description из products в product_translations
   * и удаление поля sku
   * 
   * Поля name и description перенесены в таблицу product_translations
   * Поле sku удалено полностью
   */
  async up(queryInterface, Sequelize) {


    // Удаляем колонку name из products
    await queryInterface.removeColumn('products', 'name');

    // Удаляем колонку description из products
    await queryInterface.removeColumn('products', 'description');

    // Удаляем колонку sku из products
    await queryInterface.removeColumn('products', 'sku');
  },

  async down(queryInterface, Sequelize) {
    // Добавляем колонку name обратно
    await queryInterface.addColumn('products', 'name', {
      type: Sequelize.STRING(255),
      allowNull: false,
      defaultValue: ''
    });

    // Добавляем колонку description обратно
    await queryInterface.addColumn('products', 'description', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Добавляем колонку sku обратно
    await queryInterface.addColumn('products', 'sku', {
      type: Sequelize.STRING(100),
      allowNull: true
    });

    // Копируем данные из product_translations обратно в products (только для RU языка)
    await queryInterface.sequelize.query(`
      UPDATE products
      SET 
        name = COALESCE(pt.name, ''),
        description = pt.description,
        updated_at = GREATEST(pt.updated_at, products.updated_at)
      FROM product_translations pt
      WHERE pt.product_id = products.id AND pt.language = 'RU'
    `);
  },
};
