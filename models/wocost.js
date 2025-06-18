'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class WOCost extends Model {
    static associate(models) {
      WOCost.belongsTo(models.WO, {
        foreignKey: 'wo_id',
        as: 'workingOrder'
      });
      WOCost.hasMany(models.WOCostDetail, {
        foreignKey: 'cost_id',
        as: 'costDetails'
      });
    }
  }
  WOCost.init({
    cost_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      comment: 'Kunci primer, ID unik untuk setiap jenis biaya dalam Working Order (UUID).'
    },
    wo_id: {
      type: DataTypes.UUID, // Ubah ke UUID
      allowNull: false,
      comment: 'Kunci asing yang menghubungkan ke tabel WOs.'
    },
    cost_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Jenis kategori biaya (misal: Biaya Buruh, Biaya Lembur, Biaya Petugas, Bongkar Muat, Pengiriman).'
    },
    amount_subtotal: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      comment: 'Jumlah biaya sebelum pajak untuk jenis biaya ini (subtotal).'
    },
    tax_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.00,
      comment: 'Persentase pajak yang dikenakan pada biaya ini (misal PPN).'
    },
    total_amount_after_tax: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      comment: 'Total jumlah biaya setelah perhitungan pajak.'
    },
    description: {
      type: DataTypes.TEXT,
      comment: 'Deskripsi singkat mengenai jenis biaya ini.'
    },
    cost_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Tanggal pencatatan biaya ini.'
    },
  }, {
    sequelize,
    modelName: 'WOCost',
    tableName: 'WO_Costs',
    timestamps: true,
    underscored: true
  });
  return WOCost;
};