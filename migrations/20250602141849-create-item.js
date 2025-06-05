'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Items', {
      item_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'UUID unik untuk item (barang/jasa)'
      },
      item_code: {
        type: Sequelize.STRING(100),
        unique: true,
        comment: 'Kode unik barang/jasa'
      },
      item_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Nama barang atau jasa'
      },
      unit_of_measure: {
        type: Sequelize.STRING(50),
        comment: 'Satuan pengukuran (misal: Kg, Liter, Buah, Layanan)'
      },
      description: {
        type: Sequelize.TEXT,
        comment: 'Deskripsi barang/jasa'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Timestamp pembuatan record'
      },
      last_updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        comment: 'Timestamp terakhir update record'
      }
    }, {
      tableName: 'Items',
      comment: 'Tabel untuk menyimpan master data barang atau jasa',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Items');
  }
};