'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TransactionEntry extends Model {
    static associate(models) {
      if (models.Transaction) {
        TransactionEntry.belongsTo(models.Transaction, {
          foreignKey: 'transaction_id',
          as: 'transaction'
        });
      }
      if (models.Account) {
        TransactionEntry.belongsTo(models.Account, {
          foreignKey: 'account_id',
          as: 'account'
        });
      }
    }
  }
  TransactionEntry.init({
    entry_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'UUID unik untuk setiap entri debit/kredit'
    },
    transaction_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    account_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      comment: 'Jumlah yang didebit/dikredit'
    },
    entry_type: {
      type: DataTypes.ENUM('Debit', 'Credit'),
      allowNull: false,
      comment: 'Tipe entri (Debit: keluar dari akun, Credit: masuk ke akun)'
    },
    related_entity_type: {
      type: DataTypes.STRING(50),
      comment: 'Tipe entitas terkait (misal: PO, WO, Invoice, Interest, Initial Balance, Transfer)'
    },
    related_entity_id: {
      type: DataTypes.UUID,
      comment: 'ID dari entitas terkait'
    },
    notes: {
      type: DataTypes.TEXT,
      comment: 'Catatan tambahan untuk entri ini'
    }
  }, {
    sequelize,
    modelName: 'TransactionEntry',
    tableName: 'TransactionEntries',
    timestamps: false, // Karena kita hanya punya created_at secara manual di DDL
    createdAt: 'created_at', // Masih bisa di-map jika diperlukan
    underscored: true,
    comment: 'Detail debit/kredit untuk setiap transaksi keuangan'
  });
  return TransactionEntry;
};