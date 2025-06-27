'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class WO extends Model {
    static associate(models) {
      // WO belongs to one PO. The alias 'purchaseOrder' is correctly used here.
      WO.belongsTo(models.PO, {
          foreignKey: 'po_id',
          as: 'purchaseOrder' // <-- This is the alias for PO
      });

      // WO has many Logistic Events
      WO.hasMany(models.WOLogisticEvent, {
        foreignKey: 'wo_id',
        as: 'logisticEvents',
        onDelete: 'CASCADE'
      });

      // WO has many Costs
      WO.hasMany(models.WOCost, {
        foreignKey: 'wo_id',
        as: 'costs',
        onDelete: 'CASCADE'
      });

      // WO belongs to a sender Warehouse
      WO.belongsTo(models.Warehouse, { // Opsional, uncomment jika Anda menggunakan tabel Warehouse
          foreignKey: 'sender_warehouse_id',
          as: 'sender_warehouse', // <-- This is the alias for senderWarehouse
          comment: 'Kunci asing yang menghubungkan ke tabel Warehouses.'
      });
      WO.belongsTo(models.Warehouse, { // Opsional, uncomment jika Anda menggunakan tabel Warehouse
          foreignKey: 'receiver_warehouse_id',
          as: 'receiver_warehouse', // <-- This is the alias for receiverWarehouse
          comment: 'Kunci asing yang menghubungkan ke tabel Warehouses.'
      });
    }
  }
  WO.init({
    wo_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      comment: 'Kunci primer, ID unik untuk setiap Working Order (UUID).'
    },
    po_id: {
      type: DataTypes.UUID, // Ubah ke UUID
      allowNull: false,
      comment: 'Kunci asing yang menghubungkan ke tabel POs.'
    },
    sender_warehouse_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    receiver_warehouse_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    scheduled_pickup_time: {
      type: DataTypes.DATE,
      comment: 'Waktu yang dijadwalkan untuk proses bongkar muat.'
    },
    net_weight_kg: {
      type: DataTypes.DECIMAL(10, 2),
      comment: 'Berat bersih barang dalam kilogram yang dikirim (terisi setelah delivered).'
    },
  }, {
    sequelize,
    modelName: 'WO',
    tableName: 'WOs',
    timestamps: true,
    underscored: true
  });
  return WO;
};