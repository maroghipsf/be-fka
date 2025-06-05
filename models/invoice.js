'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Invoice extends Model {
    static associate(models) {
      if (models.WorkingOrder) {
        Invoice.belongsTo(models.WorkingOrder, {
          foreignKey: 'wo_id',
          as: 'workingOrder'
        });
      }
      if (models.User) {
        Invoice.belongsTo(models.User, {
          foreignKey: 'created_by',
          as: 'creator'
        });
      }
      // Asosiasi ke transaksi pembayaran (melalui TransactionEntries) akan ditangani di logika aplikasi
    }
  }
  Invoice.init({
    invoice_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'UUID unik untuk Invoice'
    },
    wo_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    invoice_number: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'Nomor invoice unik'
    },
    invoice_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Tanggal invoice diterbitkan'
    },
    amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      comment: 'Jumlah total invoice'
    },
    status: {
      type: DataTypes.ENUM('Belum Bayar', 'Sudah Bayar', 'Jatuh Tempo'),
      allowNull: false,
      comment: 'Status pembayaran invoice'
    },
    payment_date: {
      type: DataTypes.DATEONLY,
      comment: 'Tanggal pembayaran diterima (jika sudah bayar)'
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Invoice',
    tableName: 'Invoices',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'last_updated_at',
    underscored: true,
    comment: 'Tabel untuk menyimpan data invoice yang dibuat ke Bulog setelah WO selesai'
  });
  return Invoice;
};