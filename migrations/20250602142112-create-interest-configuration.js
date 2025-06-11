'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('InterestConfigurations', {
      interest_config_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'UUID unik untuk konfigurasi bunga'
      },
      config_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Nama konfigurasi bunga (misal: Bunga Standar Modal)'
      },
      rate_percentage: {
        type: Sequelize.DECIMAL(5, 4),
        allowNull: false,
        comment: 'Persentase bunga (misal: 0.0125 untuk 1.25%)'
      },
      calculation_type: {
        type: Sequelize.ENUM('Annual', 'Monthly', 'Daily'),
        allowNull: false,
        comment: 'Tipe perhitungan bunga (Bulanan atau Harian)'
      },
      description: {
        type: Sequelize.TEXT,
        comment: 'Deskripsi konfigurasi bunga'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Status apakah konfigurasi ini aktif'
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
      tableName: 'InterestConfigurations',
      comment: 'Tabel untuk menyimpan master data konfigurasi bunga yang tersedia',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('InterestConfigurations');
  }
};