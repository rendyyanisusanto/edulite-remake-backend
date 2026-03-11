'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class MenuPermission extends Model {
        static associate(models) {
            // define association here
        }
    }
    MenuPermission.init({
        menu_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        permission_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'MenuPermission',
        tableName: 'menu_permissions',
        timestamps: false,
        underscored: true,
    });
    return MenuPermission;
};
