'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class InterestAccrual extends Model {
    static associate(models) {
      if (models.AccountInterestPeriod) {
        InterestAccrual.belongsTo(models.AccountInterestPeriod, {
          foreignKey: 'account_interest_id',
          as: 'accountInterestPeriod'
        });
      }
      if (models.Transaction) {
        InterestAccrual.belongsTo(models.Transaction, {
          foreignKey: 'posted_transaction_id',
          as: 'postedTransaction'
        });
      }
    }
  }
  InterestAccrual.init({
    accrual_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'UUID unik untuk setiap perhitungan akrual bunga'
    },
    account_interest_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    accrual_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Tanggal perhitungan bunga dilakukan'
    },
    calculated_amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      comment: 'Jumlah bunga yang terhitung untuk periode ini'
    },
    is_posted_to_balance: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Apakah bunga ini sudah ditambahkan ke saldo akun'
    },
    posted_transaction_id: {
      type: DataTypes.UUID,
      comment: 'Foreign Key ke transaksi di Transactions jika bunga sudah diposting'
    }
  }, {
    sequelize,
    modelName: 'InterestAccrual',
    tableName: 'InterestAccruals',
    timestamps: false, // Hanya created_at secara manual
    createdAt: 'created_at',
    underscored: true,
    comment: 'Tabel untuk mencatat detail perhitungan bunga yang terakumulasi'
  });
  return InterestAccrual;
};