'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Menu extends Model {
        static associate(models) {
            Menu.belongsTo(models.MenuGroup, { foreignKey: 'group_id', as: 'group' });
            Menu.belongsTo(models.Menu, { foreignKey: 'parent_id', as: 'parent' });
            Menu.hasMany(models.Menu, { foreignKey: 'parent_id', as: 'submenus' });
            Menu.belongsToMany(models.Permission, {
                through: models.MenuPermission,
                foreignKey: 'menu_id',
                otherKey: 'permission_id',
                as: 'permissions'
            });
        }
    }
    Menu.init({
        group_id: {
            type: DataTypes.INTEGER
        },
        parent_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        name: {
            type: DataTypes.STRING(100)
        },
        route: {
            type: DataTypes.STRING(100)
        },
        icon: {
            type: DataTypes.STRING(50)
        },
        permission_code: {
            type: DataTypes.STRING(100)
        },
        sort_order: {
            type: DataTypes.INTEGER
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        sequelize,
        modelName: 'Menu',
        tableName: 'menus',
        updatedAt: false,
        underscored: true,
    });
    return Menu;
};
