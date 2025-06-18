'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Warehouse extends Model {
    static associate(models) {
      // Warehouse can be an origin for many Working Orders
      if (models.WO) { // Use models.WO if your WO model is named 'WO'
        Warehouse.hasMany(models.WO, {
          foreignKey: 'sender_warehouse_id', // Correct foreign key from WO
          as: 'sentWorkingOrders' // More descriptive alias
        });
        // Warehouse can be a destination for many Working Orders
        Warehouse.hasMany(models.WO, {
          foreignKey: 'receiver_warehouse_id', // Correct foreign key from WO
          as: 'receivedWorkingOrders' // More descriptive alias
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