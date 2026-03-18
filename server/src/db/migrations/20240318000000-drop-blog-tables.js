'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Удаляем таблицы в обратном порядке (сначала дочерние)
    await queryInterface.dropTable('blog_post_media');
    await queryInterface.dropTable('blog_post_translations');
    await queryInterface.dropTable('blog_posts');
  },

  async down(queryInterface, Sequelize) {
    // Создаём таблицу blog_posts
    await queryInterface.createTable('blog_posts', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      author_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      is_published: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      published_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    // Создаём таблицу blog_post_translations
    await queryInterface.createTable('blog_post_translations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      blog_post_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'blog_posts',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      locale: {
        type: Sequelize.STRING(5),
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
    });

    // Создаём таблицу blog_post_media
    await queryInterface.createTable('blog_post_media', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      blog_post_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'blog_posts',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      media_type: {
        type: Sequelize.ENUM('image', 'video', 'youtube'),
        allowNull: false,
      },
      url: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      caption: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
    });

    // Добавляем индексы
    await queryInterface.addIndex('blog_post_translations', ['slug']);
    await queryInterface.addIndex('blog_post_media', ['blog_post_id', 'sort_order']);
  },
};
