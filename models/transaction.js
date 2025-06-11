'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    static associate(models) {
      // Pastikan semua model yang direlasikan sudah ada di models dan penamaannya benar
      if (models.User) {
        Transaction.belongsTo(models.User, {
          foreignKey: 'created_by',
          as: 'creator'
        });
      }
      if (models.TransactionEntry) {
        Transaction.hasMany(models.TransactionEntry, {
          foreignKey: 'transaction_id',
          as: 'entries'
        });
      }
      if (models.AccountInterestPeriod) {
        Transaction.hasMany(models.AccountInterestPeriod, {
          foreignKey: 'initial_transfer_transaction_id',
          as: 'interestPeriods'
        });
      }
      if (models.WOExpense) {
        Transaction.hasMany(models.WOExpense, {
          foreignKey: 'transaction_id',
          as: 'woExpenses'
        });
      }
      if (models.InterestAccrual) {
        Transaction.hasMany(models.InterestAccrual, {
          foreignKey: 'posted_transaction_id',
          as: 'interestAccruals'
        });
      }
      // Tambahkan relasi lain dengan pengecekan serupa jika perlu
    }
  }
  Transaction.init({
    transaction_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'UUID unik untuk setiap transaksi utama'
    },
    transaction_date: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Tanggal dan waktu transaksi'
    },
    transaction_type: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Jenis transaksi (Transfer, Interest Expense, Payment, dsb)'
    },
    description: {
      type: DataTypes.TEXT,
      comment: 'Deskripsi singkat transaksi'
    },
    total_amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      comment: 'Total nominal transaksi (misal: pokok transfer, biaya bunga, dsb)'
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Transaction',
    tableName: 'Transactions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'last_updated_at',
    underscored: true,
    comment: 'Log sentral untuk semua transaksi keuangan'
  });
  return Transaction;
};