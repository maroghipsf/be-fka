'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class WOCostDetail extends Model {
    static associate(models) {
      WOCostDetail.belongsTo(models.WOCost, {
        foreignKey: 'cost_id',
        as: 'parentCost'
      });
    }
  }
  WOCostDetail.init({
    detail_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      comment: 'Kunci primer, ID unik untuk setiap detail sub-biaya (UUID).'
    },
    cost_id: {
      type: DataTypes.UUID, // Ubah ke UUID
      allowNull: false,
      comment: 'Kunci asing yang menghubungkan ke tabel WO_Costs.'
    },
    detail_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Nama detail sub-biaya (misal: Tarif, Jumlah, KGS).'
    },
    detail_value: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      comment: 'Nilai numerik dari detail sub-biaya.'
    },
    unit: {
      type: DataTypes.STRING(50),
      comment: 'Satuan dari nilai detail (misal: IDR, Unit, Kg).'
    },
  }, {
    sequelize,
    modelName: 'WOCostDetail',
    tableName: 'WO_Cost_Details',
    timestamps: true,
    underscored: true
  });
  return WOCostDetail;
};