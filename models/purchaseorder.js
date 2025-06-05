'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PurchaseOrder extends Model {
    static associate(models) {
      if (models.Warehouse) {
        PurchaseOrder.belongsTo(models.Warehouse, {
          foreignKey: 'warehouse_id',
          as: 'warehouse'
        });
      }
      if (models.User) {
        PurchaseOrder.belongsTo(models.User, {
          foreignKey: 'created_by',
          as: 'creator'
        });
      }
      if (models.WorkingOrder) {
        PurchaseOrder.hasMany(models.WorkingOrder, {
          foreignKey: 'po_id',
          as: 'workingOrders'
        });
      }
    }
  }
  PurchaseOrder.init({
    po_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'UUID unik untuk Purchase Order'
    },
    po_number: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'Nomor PO unik dari Bulog'
    },
    po_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Tanggal PO diterbitkan'
    },
    tonnage: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Jumlah tonase dalam PO'
    },
    value: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      comment: 'Nilai total PO'
    },
    status: {
      type: DataTypes.ENUM('Draft', 'Dibagi ke WO', 'Selesai', 'Dibatalkan'),
      allowNull: false,
      comment: 'Status PO'
    },
    warehouse_id: {
      type: DataTypes.UUID,
      comment: 'Foreign Key ke gudang terkait PO ini (jika spesifik)'
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'PurchaseOrder',
    tableName: 'PurchaseOrders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'last_updated_at',
    underscored: true,
    comment: 'Tabel untuk menyimpan data Purchase Order dari Bulog'
  });
  return PurchaseOrder;
};