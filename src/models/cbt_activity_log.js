'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CbtActivityLog extends Model {
        static associate(models) {
            CbtActivityLog.belongsTo(models.CbtAttempt, { foreignKey: 'attempt_id', as: 'attempt' });
            CbtActivityLog.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
        }
    }
    CbtActivityLog.init({
        attempt_id: { type: DataTypes.BIGINT, allowNull: false },
        user_id: { type: DataTypes.INTEGER },
        event_type: { type: DataTypes.STRING(40), allowNull: false },
        description: { type: DataTypes.STRING(500) },
        metadata: { type: DataTypes.JSON },
        ip_address: { type: DataTypes.STRING(45) },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    }, {
        sequelize,
        modelName: 'CbtActivityLog',
        tableName: 'cbt_activity_logs',
        underscored: true,
        timestamps: false
    });
    return CbtActivityLog;
};