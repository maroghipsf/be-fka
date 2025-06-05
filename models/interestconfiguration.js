'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class InterestConfiguration extends Model {
    static associate(models) {
      if (models.AccountInterestPeriod) {
        InterestConfiguration.hasMany(models.AccountInterestPeriod, {
          foreignKey: 'interest_config_id',
          as: 'accountInterestPeriods'
        });
      }
    }
  }
  InterestConfiguration.init({
    interest_config_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'UUID unik untuk konfigurasi bunga'
    },
    config_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'Nama konfigurasi bunga (misal: Bunga Standar Modal)'
    },
    rate_percentage: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      comment: 'Persentase bunga (misal: 0.0125 untuk 1.25%)'
    },
    calculation_type: {
      type: DataTypes.ENUM('Monthly', 'Daily'),
      allowNull: false,
      comment: 'Tipe perhitungan bunga (Bulanan atau Harian)'
    },
    description: {
      type: DataTypes.TEXT,
      comment: 'Deskripsi konfigurasi bunga'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Status apakah konfigurasi ini aktif'
    }
  }, {
    sequelize,
    modelName: 'InterestConfiguration',
    tableName: 'InterestConfigurations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'last_updated_at',
    underscored: true,
    comment: 'Tabel untuk menyimpan master data konfigurasi bunga yang tersedia'
  });
  return InterestConfiguration;
};