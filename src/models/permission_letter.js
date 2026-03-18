'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class PermissionLetter extends Model {
        static associate(models) {
            PermissionLetter.belongsTo(models.Teacher, { foreignKey: 'teacher_id', as: 'teacher' });
            PermissionLetter.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
            PermissionLetter.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updater' });
            PermissionLetter.belongsTo(models.User, { foreignKey: 'approved_by', as: 'approver' });
            PermissionLetter.hasMany(models.PermissionLetterStudent, {
                foreignKey: 'permission_letter_id',
                as: 'students'
            });
        }
    }

    PermissionLetter.init({
        code: {
            type: DataTypes.STRING(50),
            unique: true
        },
        activity_name: {
            type: DataTypes.STRING(150)
        },
        purpose: {
            type: DataTypes.TEXT
        },
        start_date: {
            type: DataTypes.DATEONLY
        },
        end_date: {
            type: DataTypes.DATEONLY
        },
        start_time: {
            type: DataTypes.TIME
        },
        end_time: {
            type: DataTypes.TIME
        },
        location: {
            type: DataTypes.STRING(150)
        },
        teacher_id: {
            type: DataTypes.INTEGER
        },
        companion_name: {
            type: DataTypes.STRING(150)
        },
        status: {
            type: DataTypes.STRING(30),
            defaultValue: 'DRAFT'
        },
        notes: {
            type: DataTypes.TEXT
        },
        created_by: {
            type: DataTypes.INTEGER
        },
        updated_by: {
            type: DataTypes.INTEGER
        },
        approved_at: {
            type: DataTypes.DATE
        },
        approved_by: {
            type: DataTypes.INTEGER
        }
    }, {
        sequelize,
        modelName: 'PermissionLetter',
        tableName: 'permission_letters',
        underscored: true
    });

    return PermissionLetter;
};
