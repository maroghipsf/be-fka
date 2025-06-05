'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class WorkingOrder extends Model {
    static associate(models) {
      if (models.PurchaseOrder) {
        WorkingOrder.belongsTo(models.PurchaseOrder, {
          foreignKey: 'po_id',
          as: 'purchaseOrder'
        });
      }
      if (models.Warehouse) {
        WorkingOrder.belongsTo(models.Warehouse, {
          foreignKey: 'origin_warehouse_id',
          as: 'originWarehouse'
        });
        WorkingOrder.belongsTo(models.Warehouse, {
          foreignKey: 'destination_warehouse_id',
          as: 'destinationWarehouse'
        });
      }
      if (models.User) {
        WorkingOrder.belongsTo(models.User, {
          foreignKey: 'created_by',
          as: 'creator'
        });
      }
      if (models.WOExpense) {
        WorkingOrder.hasMany(models.WOExpense, {
          foreignKey: 'wo_id',
          as: 'expenses'
        });
      }
      if (models.Invoice) {
        WorkingOrder.hasOne(models.Invoice, {
          foreignKey: 'wo_id',
          as: 'invoice'
        });
      }
    }
  }
  WorkingOrder.init({
    wo_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'UUID unik untuk Working Order'
    },
    po_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    wo_number: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'Nomor WO unik'
    },
    wo_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Tanggal WO dibuat'
    },
    origin_warehouse_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    destination_warehouse_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    tonnage: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Tonase pengiriman untuk WO ini'
    },
    estimated_cost: {
      type: DataTypes.DECIMAL(18, 2),
      comment: 'Estimasi biaya operasional WO'
    },
    status: {
      type: DataTypes.ENUM('Draft', 'Sedang Berjalan', 'Selesai', 'Dibatalkan'),
      allowNull: false,
      comment: 'Status WO'
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'WorkingOrder',
    tableName: 'WorkingOrders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'last_updated_at',
    underscored: true,
    comment: 'Tabel untuk menyimpan detail Working Order yang dibagi dari PO'
  });
  return WorkingOrder;
};