'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Supplier extends Model {
    static associate(models) {
      // define association here jika ada, gunakan pengecekan models.NamaModel
      // Contoh:
      // if (models.SomeOtherTable) {
      //   Supplier.hasMany(models.SomeOtherTable, {
      //     foreignKey: 'supplier_id',
      //     as: 'relatedEntities'
      //   });
      // }
    }
  }
  Supplier.init({
    supplier_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'UUID unik untuk pemasok'
    },
    supplier_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Nama pemasok'
    },
    address: {
      type: DataTypes.TEXT,
      comment: 'Alamat pemasok'
    },
    phone: {
      type: DataTypes.STRING(50),
      comment: 'Nomor telepon pemasok'
    },
    email: {
      type: DataTypes.STRING(255),
      unique: true,
      comment: 'Email pemasok'
    },
    npwp: {
      type: DataTypes.STRING(30),
      unique: true,
      comment: 'NPWP pemasok (opsional)'
    }
  }, {
    sequelize,
    modelName: 'Supplier',
    tableName: 'Suppliers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'last_updated_at',
    underscored: true,
    comment: 'Tabel untuk menyimpan data pemasok barang atau jasa'
  });
  return Supplier;
};