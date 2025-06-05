'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('WorkingOrders', {
      wo_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'UUID unik untuk Working Order'
      },
      po_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'PurchaseOrders',
          key: 'po_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'Foreign Key ke Purchase Order induk'
      },
      wo_number: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Nomor WO unik'
      },
      wo_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Tanggal WO dibuat'
      },
      origin_warehouse_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Warehouses',
          key: 'warehouse_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'Foreign Key ke gudang asal'
      },
      destination_warehouse_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Warehouses',
          key: 'warehouse_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'Foreign Key ke gudang tujuan'
      },
      tonnage: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Tonase pengiriman untuk WO ini'
      },
      estimated_cost: {
        type: Sequelize.DECIMAL(18, 2),
        comment: 'Estimasi biaya operasional WO'
      },
      status: {
        type: Sequelize.ENUM('Draft', 'Sedang Berjalan', 'Selesai', 'Dibatalkan'),
        allowNull: false,
        comment: 'Status WO'
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
        comment: 'Foreign Key ke User yang membuat WO'
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
      tableName: 'WorkingOrders',
      comment: 'Tabel untuk menyimpan detail Working Order yang dibagi dari PO',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('WorkingOrders');
  }
};