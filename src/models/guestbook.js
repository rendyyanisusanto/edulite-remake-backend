'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Guestbook extends Model {
        static associate(models) {
            Guestbook.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
            Guestbook.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updater' });
        }
    }
    Guestbook.init({
        guest_name: {
            type: DataTypes.STRING(100)
        },
        guest_type: {
            type: DataTypes.STRING(30)
        },
        phone: {
            type: DataTypes.STRING(30)
        },
        address: {
            type: DataTypes.TEXT
        },
        purpose: {
            type: DataTypes.TEXT
        },
        related_person: {
            type: DataTypes.STRING(100)
        },
        visit_date: {
            type: DataTypes.DATEONLY
        },
        checkin_time: {
            type: DataTypes.DATE
        },
        checkout_time: {
            type: DataTypes.DATE
        },
        status: {
            type: DataTypes.STRING(20)
        },
        note: {
            type: DataTypes.TEXT
        },
        created_by: {
            type: DataTypes.INTEGER
        },
        updated_by: {
            type: DataTypes.INTEGER
        }
    }, {
        sequelize,
        modelName: 'Guestbook',
        tableName: 'guestbooks',
        underscored: true,
    });
    return Guestbook;
};
