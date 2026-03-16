'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Добавляем новую колонку roles типа JSONB
    await queryInterface.addColumn('users', 'roles', {
      type: Sequelize.JSONB,
      defaultValue: ['user'],
    });

    // Копируем данные из role в roles (оборачиваем в массив)
    await queryInterface.sequelize.query(`
      UPDATE users SET roles = jsonb_build_array(role)::jsonb
    `);

    // Удаляем старую колонку role
    await queryInterface.removeColumn('users', 'role');

    // Переименовываем roles в role
    await queryInterface.renameColumn('users', 'roles', 'role');
  },

  async down(queryInterface, Sequelize) {
    // Добавляем обратно колонку role типа ENUM
    await queryInterface.addColumn('users', 'role', {
      type: Sequelize.ENUM('admin', 'user', 'author'),
      defaultValue: 'user',
    });

    // Копируем данные из role (массив) обратно в role (enum) - берём первый элемент
    await queryInterface.sequelize.query(`
      UPDATE users SET role = role->0
    `);

    // Удаляем колонку role (которая сейчас массив)
    await queryInterface.removeColumn('users', 'role');

    // Переименовываем role обратно
    await queryInterface.renameColumn('users', 'role', 'role');
  },
};
