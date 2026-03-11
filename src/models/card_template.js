'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CardTemplate extends Model {
        static associate(models) {
            CardTemplate.hasMany(models.Student, { foreignKey: 'card_template_id', as: 'students' });
        }
    }
    CardTemplate.init({
        name: {
            type: DataTypes.STRING(100)
        },
        description: {
            type: DataTypes.TEXT
        },
        background_image: {
            type: DataTypes.STRING(255)
        },
        orientation: {
            type: DataTypes.STRING(20) // portrait / landscape
        },
        layout: {
            type: DataTypes.JSON
        },
        is_default: {
            type: DataTypes.BOOLEAN
        }
    }, {
        sequelize,
        modelName: 'CardTemplate',
        tableName: 'card_templates',
        underscored: true,
    });
    return CardTemplate;
};
