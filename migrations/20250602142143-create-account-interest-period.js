'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AccountInterestPeriods', {
      account_interest_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'UUID unik untuk periode bunga akun'
      },
      account_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Accounts',
          key: 'account_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'Foreign Key ke Akun Modal yang dikenakan bunga'
      },
      interest_config__id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'InterestConfigurations',
          key: 'interest_config_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'Foreign Key ke konfigurasi bunga yang digunakan'
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Tanggal bunga mulai aktif (saat transfer pemicu)'
      },
      end_date: {
        type: Sequelize.DATEONLY,
        comment: 'Tanggal bunga seharusnya berakhir berdasarkan periode'
      },
      actual_end_date: {
        type: Sequelize.DATEONLY,
        comment: 'Tanggal bunga benar-benar berakhir/dilunasi (NULL jika masih aktif)'
      },
      initial_transfer_transaction_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Transactions',
          key: 'transaction_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'Foreign Key ke transaksi transfer yang memicu bunga ini'
      },
      principal_amount: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        comment: 'Jumlah pokok dana yang ditarik dan dikenakan bunga'
      },
      status: {
        type: Sequelize.ENUM('Active', 'Settled', 'Cancelled'),
        allowNull: false,
        comment: 'Status periode bunga'
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
      tableName: 'AccountInterestPeriods',
      comment: 'Tabel untuk melacak setiap periode bunga aktif untuk akun modal',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('AccountInterestPeriods');
  }
};