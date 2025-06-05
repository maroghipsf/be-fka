'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('TransactionEntries', {
      entry_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'UUID unik untuk setiap entri debit/kredit'
      },
      transaction_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Transactions',
          key: 'transaction_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // Jika transaksi utama dihapus, entri juga dihapus
        comment: 'Foreign Key ke transaksi utama'
      },
      account_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Accounts',
          key: 'account_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // Jangan hapus akun jika masih ada entri transaksi
        comment: 'Foreign Key ke akun yang terpengaruh'
      },
      amount: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        comment: 'Jumlah yang didebit/dikredit'
      },
      entry_type: {
        type: Sequelize.ENUM('Debit', 'Credit'),
        allowNull: false,
        comment: 'Tipe entri (Debit: keluar dari akun, Credit: masuk ke akun)'
      },
      related_entity_type: {
        type: Sequelize.STRING(50),
        comment: 'Tipe entitas terkait (misal: PO, WO, Invoice, Interest, Initial Balance, Transfer)'
      },
      related_entity_id: {
        type: Sequelize.UUID,
        comment: 'ID dari entitas terkait'
      },
      notes: {
        type: Sequelize.TEXT,
        comment: 'Catatan tambahan untuk entri ini'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Timestamp pembuatan record'
      }
      // last_updated_at tidak diperlukan di sini karena hanya mencatat satu entri
    }, {
      tableName: 'TransactionEntries',
      comment: 'Detail debit/kredit untuk setiap transaksi keuangan',
      timestamps: false, // Tidak menggunakan timestamps default Sequelize untuk ini
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('TransactionEntries');
  }
};