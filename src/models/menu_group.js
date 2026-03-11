'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class MenuGroup extends Model {
        static associate(models) {
            MenuGroup.hasMany(models.Menu, { foreignKey: 'group_id', as: 'menus' });
        }
    }
    MenuGroup.init({
        name: {
            type: DataTypes.STRING(100)
        },
        icon: {
            type: DataTypes.STRING(50)
        },
        sort_order: {
            type: DataTypes.INTEGER
        }
    }, {
        sequelize,
        modelName: 'MenuGroup',
        tableName: 'menu_groups',
        updatedAt: false,
        underscored: true,
    });
    return MenuGroup;
};
