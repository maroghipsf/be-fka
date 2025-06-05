'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Account extends Model {
    static associate(models) {
      if (models.TransactionEntry) {
        Account.hasMany(models.TransactionEntry, {
          foreignKey: 'account_id',
          as: 'transactionEntries'
        });
      }
      if (models.AccountInterestPeriod) {
        Account.hasMany(models.AccountInterestPeriod, {
          foreignKey: 'account_id',
          as: 'interestPeriods'
        });
      }
      // Tambahkan relasi lain dengan pengecekan serupa jika perlu
    }
  }
  Account.init({
    account_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'UUID unik untuk setiap akun keuangan'
    },
    account_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Nama akun (misal: Bank A, Bank B, BNI Operasional)'
    },
    account_type: {
      type: DataTypes.ENUM('Modal', 'Operasional'),
      allowNull: false,
      comment: 'Tipe akun (Modal atau Operasional)'
    },
    current_balance: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'Saldo berjalan akun'
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'IDR',
      comment: 'Mata uang akun'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Status aktivasi akun'
    }
  }, {
    sequelize,
    modelName: 'Account',
    tableName: 'Accounts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'last_updated_at',
    underscored: true,
    comment: 'Tabel inti untuk semua akun keuangan (bank modal dan operasional)'
  });
  return Account;
};