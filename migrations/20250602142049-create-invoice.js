'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Invoices', {
      invoice_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'UUID unik untuk Invoice'
      },
      wo_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'WorkingOrders',
          key: 'wo_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // Jangan hapus WO jika masih ada invoice
        comment: 'Foreign Key ke Working Order terkait'
      },
      invoice_number: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Nomor invoice unik'
      },
      invoice_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Tanggal invoice diterbitkan'
      },
      amount: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        comment: 'Jumlah total invoice'
      },
      status: {
        type: Sequelize.ENUM('Belum Bayar', 'Sudah Bayar', 'Jatuh Tempo'),
        allowNull: false,
        comment: 'Status pembayaran invoice'
      },
      payment_date: {
        type: Sequelize.DATEONLY,
        comment: 'Tanggal pembayaran diterima (jika sudah bayar)'
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
        comment: 'Foreign Key ke User yang membuat invoice'
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
      tableName: 'Invoices',
      comment: 'Tabel untuk menyimpan data invoice yang dibuat ke Bulog setelah WO selesai',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Invoices');
  }
};