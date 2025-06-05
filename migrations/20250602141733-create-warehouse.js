'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Warehouses', {
      warehouse_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'UUID unik untuk gudang'
      },
      warehouse_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Nama gudang'
      },
      location: {
        type: Sequelize.TEXT,
        comment: 'Alamat atau lokasi gudang'
      },
      bulog_code: {
        type: Sequelize.STRING(50),
        unique: true,
        comment: 'Kode unik Bulog untuk gudang (jika ada)'
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
      tableName: 'Warehouses',
      comment: 'Tabel untuk menyimpan data gudang yang dikelola',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Warehouses');
  }
};