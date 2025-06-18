'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PO extends Model {
    static associate(models) {
      PO.hasMany(models.WO, {
        foreignKey: 'po_id',
        as: 'workingOrders'
      });
    }
  }
  PO.init({
    po_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4, // UUID v4 otomatis
      allowNull: false,
      comment: 'Kunci primer, ID unik untuk setiap Purchase Order (UUID).'
    },
    status_po: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Creation',
      comment: 'Status Purchase Order (misal: Creation, Release, Completed).'
    },
    project: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Nama proyek terkait Purchase Order ini.'
    },
    sdip_no: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Nomor SDIP terkait Purchase Order ini.'
    },
    party_ton: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Jumlah party yang seharus nya di kirim'
    },
    po_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Tanggal Purchase Order dibuat.'
    },
    description: {
      type: DataTypes.TEXT,
      comment: 'Keterangan tambahan atau deskripsi Purchase Order.'
    },
  }, {
    sequelize,
    modelName: 'PO',
    tableName: 'POs',
    timestamps: true,
    underscored: true
  });
  return PO;
};