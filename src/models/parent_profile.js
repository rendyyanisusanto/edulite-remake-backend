'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ParentProfile extends Model {
        static associate(models) {
            ParentProfile.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
        }
    }
    ParentProfile.init({
        student_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        type: {
            type: DataTypes.STRING(20) // AYAH, IBU, WALI
        },
        full_name: {
            type: DataTypes.STRING(100)
        },
        nik: {
            type: DataTypes.STRING(30)
        },
        phone: {
            type: DataTypes.STRING(30)
        },
        email: {
            type: DataTypes.STRING(100)
        },
        occupation: {
            type: DataTypes.STRING(100)
        },
        education: {
            type: DataTypes.STRING(100)
        },
        is_guardian: {
            type: DataTypes.BOOLEAN
        },
        address: {
            type: DataTypes.TEXT
        }
    }, {
        sequelize,
        modelName: 'ParentProfile',
        tableName: 'parent_profiles',
        underscored: true,
    });
    return ParentProfile;
};
