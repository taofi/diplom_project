'use strict';

module.exports = {
  async up(queryInterface) {
    // ProductLicense -> Product
    await queryInterface.sequelize.query(`
      ALTER TABLE "product_licenses"
      DROP CONSTRAINT IF EXISTS "product_licenses_product_id_fkey",
      ADD CONSTRAINT "product_licenses_product_id_fkey"
        FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE;
    `);

    // OrderItem -> ProductLicense
    await queryInterface.sequelize.query(`
      ALTER TABLE "order_items"
      DROP CONSTRAINT IF EXISTS "order_items_product_license_id_fkey",
      ADD CONSTRAINT "order_items_product_license_id_fkey"
        FOREIGN KEY ("product_license_id") REFERENCES "product_licenses" ("id") ON DELETE CASCADE;
    `);

    // CartItem -> ProductLicense
    await queryInterface.sequelize.query(`
      ALTER TABLE "cart_items"
      DROP CONSTRAINT IF EXISTS "cart_items_product_license_id_fkey",
      ADD CONSTRAINT "cart_items_product_license_id_fkey"
        FOREIGN KEY ("product_license_id") REFERENCES "product_licenses" ("id") ON DELETE CASCADE;
    `);

    // UserProduct -> ProductLicense
    await queryInterface.sequelize.query(`
      ALTER TABLE "user_products"
      DROP CONSTRAINT IF EXISTS "user_products_product_license_id_fkey",
      ADD CONSTRAINT "user_products_product_license_id_fkey"
        FOREIGN KEY ("product_license_id") REFERENCES "product_licenses" ("id") ON DELETE CASCADE;
    `);

    // ProductMedia -> Product
    await queryInterface.sequelize.query(`
      ALTER TABLE "product_media"
      DROP CONSTRAINT IF EXISTS "product_media_product_id_fkey",
      ADD CONSTRAINT "product_media_product_id_fkey"
        FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE;
    `);

    // ProductTranslation -> Product
    await queryInterface.sequelize.query(`
      ALTER TABLE "product_translations"
      DROP CONSTRAINT IF EXISTS "product_translations_product_id_fkey",
      ADD CONSTRAINT "product_translations_product_id_fkey"
        FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE;
    `);

    // ProductCategory -> Product
    await queryInterface.sequelize.query(`
      ALTER TABLE "product_categories"
      DROP CONSTRAINT IF EXISTS "product_categories_product_id_fkey",
      ADD CONSTRAINT "product_categories_product_id_fkey"
        FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE;
    `);

    // ChatRoom -> Product
    await queryInterface.sequelize.query(`
      ALTER TABLE "chat_rooms"
      DROP CONSTRAINT IF EXISTS "chat_rooms_product_id_fkey",
      ADD CONSTRAINT "chat_rooms_product_id_fkey"
        FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE;
    `);

    // ChatRoom -> UserProduct
    await queryInterface.sequelize.query(`
      ALTER TABLE "chat_rooms"
      DROP CONSTRAINT IF EXISTS "chat_rooms_user_product_id_fkey",
      ADD CONSTRAINT "chat_rooms_user_product_id_fkey"
        FOREIGN KEY ("user_product_id") REFERENCES "user_products" ("id") ON DELETE CASCADE;
    `);

    // Offer -> ChatRoom
    await queryInterface.sequelize.query(`
      ALTER TABLE "offers"
      DROP CONSTRAINT IF EXISTS "offers_chat_room_id_fkey",
      ADD CONSTRAINT "offers_chat_room_id_fkey"
        FOREIGN KEY ("chat_room_id") REFERENCES "chat_rooms" ("id") ON DELETE CASCADE;
    `);

    // OfferFile -> Offer
    await queryInterface.sequelize.query(`
      ALTER TABLE "offer_files"
      DROP CONSTRAINT IF EXISTS "offer_files_offer_id_fkey",
      ADD CONSTRAINT "offer_files_offer_id_fkey"
        FOREIGN KEY ("offer_id") REFERENCES "offers" ("id") ON DELETE CASCADE;
    `);

    // ChatMessage -> ChatRoom
    await queryInterface.sequelize.query(`
      ALTER TABLE "chat_messages"
      DROP CONSTRAINT IF EXISTS "chat_messages_chat_room_id_fkey",
      ADD CONSTRAINT "chat_messages_chat_room_id_fkey"
        FOREIGN KEY ("chat_room_id") REFERENCES "chat_rooms" ("id") ON DELETE CASCADE;
    `);

    // ChatMessageAttachment -> ChatMessage
    await queryInterface.sequelize.query(`
      ALTER TABLE "chat_message_attachments"
      DROP CONSTRAINT IF EXISTS "chat_message_attachments_chat_message_id_fkey",
      ADD CONSTRAINT "chat_message_attachments_chat_message_id_fkey"
        FOREIGN KEY ("chat_message_id") REFERENCES "chat_messages" ("id") ON DELETE CASCADE;
    `);

    // ChatMessageAttachment -> ChatRoom
    await queryInterface.sequelize.query(`
      ALTER TABLE "chat_message_attachments"
      DROP CONSTRAINT IF EXISTS "chat_message_attachments_chat_room_id_fkey",
      ADD CONSTRAINT "chat_message_attachments_chat_room_id_fkey"
        FOREIGN KEY ("chat_room_id") REFERENCES "chat_rooms" ("id") ON DELETE CASCADE;
    `);
  },

  async down(queryInterface) {
    // Reverse: remove ON DELETE CASCADE (restore default RESTRICT/NO ACTION)
    await queryInterface.sequelize.query(`
      ALTER TABLE "product_licenses"
      DROP CONSTRAINT "product_licenses_product_id_fkey",
      ADD CONSTRAINT "product_licenses_product_id_fkey"
        FOREIGN KEY ("product_id") REFERENCES "products" ("id");
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "order_items"
      DROP CONSTRAINT "order_items_product_license_id_fkey",
      ADD CONSTRAINT "order_items_product_license_id_fkey"
        FOREIGN KEY ("product_license_id") REFERENCES "product_licenses" ("id");
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "cart_items"
      DROP CONSTRAINT "cart_items_product_license_id_fkey",
      ADD CONSTRAINT "cart_items_product_license_id_fkey"
        FOREIGN KEY ("product_license_id") REFERENCES "product_licenses" ("id");
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "user_products"
      DROP CONSTRAINT "user_products_product_license_id_fkey",
      ADD CONSTRAINT "user_products_product_license_id_fkey"
        FOREIGN KEY ("product_license_id") REFERENCES "product_licenses" ("id");
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "product_media"
      DROP CONSTRAINT "product_media_product_id_fkey",
      ADD CONSTRAINT "product_media_product_id_fkey"
        FOREIGN KEY ("product_id") REFERENCES "products" ("id");
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "product_translations"
      DROP CONSTRAINT "product_translations_product_id_fkey",
      ADD CONSTRAINT "product_translations_product_id_fkey"
        FOREIGN KEY ("product_id") REFERENCES "products" ("id");
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "product_categories"
      DROP CONSTRAINT "product_categories_product_id_fkey",
      ADD CONSTRAINT "product_categories_product_id_fkey"
        FOREIGN KEY ("product_id") REFERENCES "products" ("id");
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "chat_rooms"
      DROP CONSTRAINT "chat_rooms_product_id_fkey",
      ADD CONSTRAINT "chat_rooms_product_id_fkey"
        FOREIGN KEY ("product_id") REFERENCES "products" ("id");
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "chat_rooms"
      DROP CONSTRAINT "chat_rooms_user_product_id_fkey",
      ADD CONSTRAINT "chat_rooms_user_product_id_fkey"
        FOREIGN KEY ("user_product_id") REFERENCES "user_products" ("id");
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "offers"
      DROP CONSTRAINT "offers_chat_room_id_fkey",
      ADD CONSTRAINT "offers_chat_room_id_fkey"
        FOREIGN KEY ("chat_room_id") REFERENCES "chat_rooms" ("id");
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "offer_files"
      DROP CONSTRAINT "offer_files_offer_id_fkey",
      ADD CONSTRAINT "offer_files_offer_id_fkey"
        FOREIGN KEY ("offer_id") REFERENCES "offers" ("id");
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "chat_messages"
      DROP CONSTRAINT "chat_messages_chat_room_id_fkey",
      ADD CONSTRAINT "chat_messages_chat_room_id_fkey"
        FOREIGN KEY ("chat_room_id") REFERENCES "chat_rooms" ("id");
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "chat_message_attachments"
      DROP CONSTRAINT "chat_message_attachments_chat_message_id_fkey",
      ADD CONSTRAINT "chat_message_attachments_chat_message_id_fkey"
        FOREIGN KEY ("chat_message_id") REFERENCES "chat_messages" ("id");
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "chat_message_attachments"
      DROP CONSTRAINT "chat_message_attachments_chat_room_id_fkey",
      ADD CONSTRAINT "chat_message_attachments_chat_room_id_fkey"
        FOREIGN KEY ("chat_room_id") REFERENCES "chat_rooms" ("id");
    `);
  },
};
