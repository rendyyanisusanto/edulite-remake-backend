'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Permission extends Model {
        static associate(models) {
            Permission.belongsToMany(models.Role, {
                through: models.RolePermission,
                foreignKey: 'permission_id',
                otherKey: 'role_id',
                as: 'roles'
            });
            Permission.belongsToMany(models.Menu, {
                through: models.MenuPermission,
                foreignKey: 'permission_id',
                otherKey: 'menu_id',
                as: 'menus'
            });
        }
    }
    Permission.init({
        code: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true
        },
        name: {
            type: DataTypes.STRING(150)
        },
        description: {
            type: DataTypes.TEXT
        }
    }, {
        sequelize,
        modelName: 'Permission',
        tableName: 'permissions',
        updatedAt: false,
        underscored: true,
    });
    return Permission;
};
