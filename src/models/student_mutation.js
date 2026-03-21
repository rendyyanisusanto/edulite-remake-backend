'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class StudentMutation extends Model {
        static associate(models) {
            StudentMutation.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
            StudentMutation.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
            StudentMutation.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updater' });
            StudentMutation.belongsTo(models.User, { foreignKey: 'approved_by', as: 'approver' });
        }
    }
    StudentMutation.init({
        student_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        mutation_type: {
            type: DataTypes.STRING(10),
            allowNull: false // IN or OUT
        },
        mutation_category: {
            type: DataTypes.STRING(30),
            allowNull: false // TRANSFER, DROPOUT, GRADUATED, OTHER
        },
        mutation_date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        effective_date: {
            type: DataTypes.DATEONLY
        },
        destination_school: {
            type: DataTypes.STRING(150)
        },
        origin_school: {
            type: DataTypes.STRING(150)
        },
        reason: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT
        },
        status: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: 'DRAFT'
        },
        document_number: {
            type: DataTypes.STRING(100)
        },
        document_file: {
            type: DataTypes.STRING(255)
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
        approved_by: {
            type: DataTypes.INTEGER
        },
        approved_at: {
            type: DataTypes.DATE
        }
    }, {
        sequelize,
        modelName: 'StudentMutation',
        tableName: 'student_mutations',
        underscored: true,
    });
    return StudentMutation;
};
