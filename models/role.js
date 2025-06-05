'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    static associate(models) {
      if (models.User) {
        Role.hasMany(models.User, {
          foreignKey: 'role_id',
          as: 'users'
        });
      }
    }
  }
  Role.init({
    role_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'UUID unik untuk peran pengguna'
    },
    role_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Nama peran (misal: Admin, Manajer Keuangan, Staf PO)'
    },
    description: {
      type: DataTypes.TEXT,
      comment: 'Deskripsi peran'
    },
    // created_at dan last_updated_at akan otomatis dihandle Sequelize jika timestamps: true
  }, {
    sequelize,
    modelName: 'Role',
    tableName: 'Roles', // Pastikan nama tabel di DB sesuai
    timestamps: true, // true karena kita ingin Sequelize mengelola created_at dan updated_at
    createdAt: 'created_at', // Map Sequelize's createdAt to your column name
    updatedAt: 'last_updated_at', // Map Sequelize's updatedAt to your column name
    underscored: true, // Menggunakan snake_case untuk nama kolom di DB
    comment: 'Tabel untuk mendefinisikan peran pengguna dan hak akses'
  });
  return Role;
};