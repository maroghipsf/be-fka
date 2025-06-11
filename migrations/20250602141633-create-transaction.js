'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Transactions', {
      transaction_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'UUID unik untuk setiap transaksi utama'
      },
      transaction_date: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Tanggal dan waktu transaksi'
      },
      transaction_type: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Jenis transaksi (Transfer, Interest Expense, Payment, dsb)'
      },
      description: {
        type: Sequelize.TEXT,
        comment: 'Deskripsi singkat transaksi'
      },
      total_amount: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: false,
        comment: 'Total nominal transaksi (misal: pokok transfer, biaya bunga, dsb)'
      },
      reference_number: {
        type: Sequelize.STRING(100),
        unique: true,
        comment: 'Nomor referensi eksternal (PO, WO, Invoice, Bank Ref)'
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users', // Nama tabel Users
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'Foreign Key ke User yang membuat transaksi'
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
      tableName: 'Transactions',
      comment: 'Log sentral untuk semua transaksi keuangan',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Transactions');
  }
};