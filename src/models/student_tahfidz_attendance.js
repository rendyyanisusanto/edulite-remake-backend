'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StudentTahfidzAttendance extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      StudentTahfidzAttendance.belongsTo(models.Student, {
        foreignKey: 'student_id',
        as: 'student'
      });
      StudentTahfidzAttendance.belongsTo(models.Class, {
        foreignKey: 'class_id',
        as: 'class_info'
      });
    }
  }
  
  StudentTahfidzAttendance.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    class_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    attendance_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('present', 'permission', 'sick', 'absent'),
      allowNull: false,
      defaultValue: 'present'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_by: {
      type: DataTypes.STRING,
      allowNull: true
    },
    updated_by: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'StudentTahfidzAttendance',
    tableName: 'student_tahfidz_attendances',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  
  return StudentTahfidzAttendance;
};
