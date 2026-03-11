'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class RolePermission extends Model {
        static associate(models) {
            // define association here
        }
    }
    RolePermission.init({
        role_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        permission_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'RolePermission',
        tableName: 'role_permissions',
        timestamps: false,
        underscored: true,
    });
    return RolePermission;
};
