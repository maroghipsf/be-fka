'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Warehouse extends Model {
    static associate(models) {
      if (models.PurchaseOrder) {
        Warehouse.hasMany(models.PurchaseOrder, {
          foreignKey: 'warehouse_id',
          as: 'purchaseOrders'
        });
      }
      if (models.WorkingOrder) {
        Warehouse.hasMany(models.WorkingOrder, {
          foreignKey: 'origin_warehouse_id',
          as: 'originWorkingOrders'
        });
        Warehouse.hasMany(models.WorkingOrder, {
          foreignKey: 'destination_warehouse_id',
          as: 'destinationWorkingOrders'
        });
      }
    }
  }
  Warehouse.init({
    warehouse_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'UUID unik untuk gudang'
    },
    warehouse_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Nama gudang'
    },
    location: {
      type: DataTypes.TEXT,
      comment: 'Alamat atau lokasi gudang'
    },
    bulog_code: {
      type: DataTypes.STRING(50),
      unique: true,
      comment: 'Kode unik Bulog untuk gudang (jika ada)'
    }
  }, {
    sequelize,
    modelName: 'Warehouse',
    tableName: 'Warehouses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'last_updated_at',
    underscored: true,
    comment: 'Tabel untuk menyimpan data gudang yang dikelola'
  });
  return Warehouse;
};