'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('WOs', {
      wo_id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        comment: 'Kunci primer, ID unik untuk setiap Working Order (UUID).'
      },
      po_id: {
        type: Sequelize.UUID, // Ubah ke UUID
        allowNull: false,
        references: { // Foreign Key
          model: 'POs', // Nama tabel yang direferensikan
          key: 'po_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Kunci asing yang menghubungkan ke tabel POs.'
      },
      sender_warehouse_id: { // Opsional, uncomment jika Anda menggunakan tabel Warehouse
        type: Sequelize.UUID, // Jika Warehouse_ID juga UUID
        references: {
          model: 'Warehouses',
          key: 'warehouse_id'
        },
        onUpdate: 'SET NULL',
        onDelete: 'SET NULL',
        comment: 'Kunci asing yang menghubungkan ke tabel Warehouses (jika ada penjadwalan gudang).'
      },
      receiver_warehouse_id: { // Opsional, uncomment jika Anda menggunakan tabel Warehouse
        type: Sequelize.UUID, // Jika Warehouse_ID juga UUID
        references: {
          model: 'Warehouses',
          key: 'warehouse_id'
        },
        onUpdate: 'SET NULL',
        onDelete: 'SET NULL',
        comment: 'Kunci asing yang menghubungkan ke tabel Warehouses (jika ada penjadwalan gudang).'
      },
      scheduled_pickup_time: {
        type: Sequelize.DATE,
        comment: 'Waktu yang dijadwalkan untuk proses bongkar muat.'
      },
      net_weight_kg: {
        type: Sequelize.DECIMAL(10, 2),
        comment: 'Berat bersih barang dalam kilogram yang dikirim (terisi setelah delivered).'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Waktu record Working Order ini dibuat.'
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        comment: 'Waktu terakhir record Working Order ini diperbarui.'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('WOs');
  }
};