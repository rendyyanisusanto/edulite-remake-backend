'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Session extends Model {
        static associate(models) {
            Session.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
        }
    }
    Session.init({
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        access_token: {
            type: DataTypes.STRING(255)
        },
        refresh_token: {
            type: DataTypes.STRING(255)
        },
        expires_at: {
            type: DataTypes.DATE
        }
    }, {
        sequelize,
        modelName: 'Session',
        tableName: 'sessions',
        updatedAt: false,
        underscored: true,
    });
    return Session;
};
