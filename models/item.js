'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Item extends Model {
    static associate(models) {
      // define association here jika ada, gunakan pengecekan models.NamaModel
      // Contoh:
      // if (models.SomeOtherTable) {
      //   Item.hasMany(models.SomeOtherTable, {
      //     foreignKey: 'item_id',
      //     as: 'relatedEntities'
      //   });
      // }
    }
  }
  Item.init({
    item_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'UUID unik untuk item (barang/jasa)'
    },
    item_code: {
      type: DataTypes.STRING(100),
      unique: true,
      comment: 'Kode unik barang/jasa'
    },
    item_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Nama barang atau jasa'
    },
    unit_of_measure: {
      type: DataTypes.STRING(50),
      comment: 'Satuan pengukuran (misal: Kg, Liter, Buah, Layanan)'
    },
    description: {
      type: DataTypes.TEXT,
      comment: 'Deskripsi barang/jasa'
    }
  }, {
    sequelize,
    modelName: 'Item',
    tableName: 'Items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'last_updated_at',
    underscored: true,
    comment: 'Tabel untuk menyimpan master data barang atau jasa'
  });
  return Item;
};