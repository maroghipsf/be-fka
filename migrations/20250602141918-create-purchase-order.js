'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('PurchaseOrders', {
      po_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'UUID unik untuk Purchase Order'
      },
      po_number: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Nomor PO unik dari Bulog'
      },
      po_date: {
        type: Sequelize.DATEONLY, // Hanya tanggal
        allowNull: false,
        comment: 'Tanggal PO diterbitkan'
      },
      tonnage: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Jumlah tonase dalam PO'
      },
      value: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        comment: 'Nilai total PO'
      },
      status: {
        type: Sequelize.ENUM('Draft', 'Dibagi ke WO', 'Selesai', 'Dibatalkan'),
        allowNull: false,
        comment: 'Status PO'
      },
      warehouse_id: {
        type: Sequelize.UUID,
        references: {
          model: 'Warehouses',
          key: 'warehouse_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL', // Jika gudang dihapus, PO tetap ada tapi ref ke gudang jadi NULL
        comment: 'Foreign Key ke gudang terkait PO ini (jika spesifik)'
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'Foreign Key ke User yang membuat PO'
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
      tableName: 'PurchaseOrders',
      comment: 'Tabel untuk menyimpan data Purchase Order dari Bulog',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('PurchaseOrders');
  }
};