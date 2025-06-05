'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('InterestAccruals', {
      accrual_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'UUID unik untuk setiap perhitungan akrual bunga'
      },
      account_interest_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'AccountInterestPeriods',
          key: 'account_interest_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // Jika periode bunga dihapus, akrual juga dihapus
        comment: 'Foreign Key ke periode bunga akun terkait'
      },
      accrual_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Tanggal perhitungan bunga dilakukan'
      },
      calculated_amount: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        comment: 'Jumlah bunga yang terhitung untuk periode ini'
      },
      is_posted_to_balance: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Apakah bunga ini sudah ditambahkan ke saldo akun'
      },
      posted_transaction_id: {
        type: Sequelize.UUID,
        references: {
          model: 'Transactions',
          key: 'transaction_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL', // Jika transaksi posting dihapus, referensi bisa NULL
        comment: 'Foreign Key ke transaksi di Transactions jika bunga sudah diposting'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Timestamp pembuatan record'
      }
      // Tidak ada last_updated_at karena akrual bersifat historis
    }, {
      tableName: 'InterestAccruals',
      comment: 'Tabel untuk mencatat detail perhitungan bunga yang terakumulasi',
      timestamps: false, // Hanya ada created_at, tidak ada updated_at
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('InterestAccruals');
  }
};