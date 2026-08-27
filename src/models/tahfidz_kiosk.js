'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TahfidzKiosk extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      TahfidzKiosk.belongsTo(models.Class, {
        foreignKey: 'class_id',
        as: 'class_info'
      });
    }
  }
  
  TahfidzKiosk.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    class_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    created_by: {
      type: DataTypes.STRING,
      allowNull: true
    },
    updated_by: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'TahfidzKiosk',
    tableName: 'tahfidz_kiosks',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  
  return TahfidzKiosk;
};