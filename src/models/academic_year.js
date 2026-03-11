'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class AcademicYear extends Model {
        static associate(models) {
            AcademicYear.hasMany(models.StudentClassHistory, { foreignKey: 'academic_year_id', as: 'class_histories' });
        }
    }
    AcademicYear.init({
        name: {
            type: DataTypes.STRING(50)
        },
        start_date: {
            type: DataTypes.DATEONLY
        },
        end_date: {
            type: DataTypes.DATEONLY
        },
        is_active: {
            type: DataTypes.BOOLEAN
        }
    }, {
        sequelize,
        modelName: 'AcademicYear',
        tableName: 'academic_years',
        underscored: true,
    });
    return AcademicYear;
};
