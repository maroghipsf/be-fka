'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AccountInterestPeriod extends Model {
    static associate(models) {
      if (models.Account) {
        AccountInterestPeriod.belongsTo(models.Account, {
          foreignKey: 'account_id',
          as: 'account'
        });
      }
      if (models.InterestConfiguration) {
        AccountInterestPeriod.belongsTo(models.InterestConfiguration, {
          foreignKey: 'interest_config_id',
          as: 'interestConfiguration'
        });
      }
      if (models.Transaction) {
        AccountInterestPeriod.belongsTo(models.Transaction, {
          foreignKey: 'initial_transfer_transaction_id',
          as: 'initialTransferTransaction'
        });
      }
      if (models.InterestAccrual) {
        AccountInterestPeriod.hasMany(models.InterestAccrual, {
          foreignKey: 'account_interest_id',
          as: 'accruals'
        });
      }
    }
  }
  AccountInterestPeriod.init({
    account_interest_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'UUID unik untuk periode bunga akun'
    },
    account_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    interest_config_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Tanggal bunga mulai aktif (saat transfer pemicu)'
    },
    end_date: {
      type: DataTypes.DATEONLY,
      comment: 'Tanggal bunga seharusnya berakhir berdasarkan periode'
    },
    actual_end_date: {
      type: DataTypes.DATEONLY,
      comment: 'Tanggal bunga benar-benar berakhir/dilunasi (NULL jika masih aktif)'
    },
    initial_transfer_transaction_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Foreign Key ke transaksi transfer yang memicu bunga ini'
    },
    principal_amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      comment: 'Jumlah pokok dana yang ditarik dan dikenakan bunga'
    },
    status: {
      type: DataTypes.ENUM('Active', 'Settled', 'Cancelled'),
      allowNull: false,
      comment: 'Status periode bunga'
    }
  }, {
    sequelize,
    modelName: 'AccountInterestPeriod',
    tableName: 'AccountInterestPeriods',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'last_updated_at',
    underscored: true,
    comment: 'Tabel untuk melacak setiap periode bunga aktif untuk akun modal'
  });
  return AccountInterestPeriod;
};