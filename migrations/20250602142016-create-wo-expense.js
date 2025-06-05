'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('WOExpenses', {
      expense_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'UUID unik untuk biaya WO'
      },
      wo_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'WorkingOrders',
          key: 'wo_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // Jika WO dihapus, pengeluaran juga dihapus
        comment: 'Foreign Key ke Working Order terkait'
      },
      expense_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Tanggal pengeluaran'
      },
      expense_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Jenis pengeluaran (misal: Truk, Tukang, BBM, Tol)'
      },
      amount: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        comment: 'Jumlah pengeluaran'
      },
      description: {
        type: Sequelize.TEXT,
        comment: 'Deskripsi detail pengeluaran'
      },
      transaction_id: {
        type: Sequelize.UUID,
        references: {
          model: 'Transactions', // Merujuk ke transaksi utama
          key: 'transaction_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL', // Biaya tetap ada, tapi referensi transaksi bisa NULL jika transaksi dihapus
        comment: 'Foreign Key ke transaksi di Transactions jika sudah diposting ke keuangan'
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
        comment: 'Foreign Key ke User yang mencatat pengeluaran'
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
      tableName: 'WOExpenses',
      comment: 'Rincian biaya operasional untuk setiap Working Order',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('WOExpenses');
  }
};