'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class WoExpense extends Model {
    static associate(models) {
      if (models.WorkingOrder) {
        WoExpense.belongsTo(models.WorkingOrder, {
          foreignKey: 'wo_id',
          as: 'workingOrder'
        });
      }
      if (models.Transaction) {
        WoExpense.belongsTo(models.Transaction, {
          foreignKey: 'transaction_id',
          as: 'transaction'
        });
      }
      if (models.User) {
        WoExpense.belongsTo(models.User, {
          foreignKey: 'created_by',
          as: 'creator'
        });
      }
    }
  }
  WoExpense.init({
    expense_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'UUID unik untuk biaya WO'
    },
    wo_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    expense_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Tanggal pengeluaran'
    },
    expense_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Jenis pengeluaran (misal: Truk, Tukang, BBM, Tol)'
    },
    amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      comment: 'Jumlah pengeluaran'
    },
    description: {
      type: DataTypes.TEXT,
      comment: 'Deskripsi detail pengeluaran'
    },
    transaction_id: {
      type: DataTypes.UUID,
      comment: 'Foreign Key ke transaksi di Transactions jika sudah diposting ke keuangan'
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'WoExpense',
    tableName: 'WOExpenses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'last_updated_at',
    underscored: true,
    comment: 'Rincian biaya operasional untuk setiap Working Order'
  });
  return WoExpense;
};