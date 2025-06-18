'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    static associate(models) {
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
      if (models.InterestAccrual) {
        Transaction.hasMany(models.InterestAccrual, {
          foreignKey: 'posted_transaction_id',
          as: 'interestAccruals'
        });
      }
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
    reference_number: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: true,
      comment: 'Nomor referensi eksternal (PO, WO, Invoice, Bank Ref)'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Foreign Key ke User yang membuat transaksi'
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
