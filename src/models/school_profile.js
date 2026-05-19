'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class SchoolProfile extends Model {
        static associate(models) {
            SchoolProfile.hasMany(models.DocumentSetting, {
                foreignKey: 'school_profile_id',
                as: 'documentSettings'
            });
        }
    }

    SchoolProfile.init({
        name: {
            type: DataTypes.STRING(150),
            allowNull: false
        },
        short_name: { type: DataTypes.STRING(100) },
        npsn: { type: DataTypes.STRING(30) },
        nss: { type: DataTypes.STRING(30) },
        level: { type: DataTypes.STRING(30) },
        status: { type: DataTypes.STRING(30) },
        foundation_name: { type: DataTypes.STRING(150) },
        phone: { type: DataTypes.STRING(30) },
        email: { type: DataTypes.STRING(100) },
        website: { type: DataTypes.STRING(150) },
        address: { type: DataTypes.TEXT },
        village: { type: DataTypes.STRING(100) },
        district: { type: DataTypes.STRING(100) },
        city: { type: DataTypes.STRING(100) },
        province: { type: DataTypes.STRING(100) },
        postal_code: { type: DataTypes.STRING(20) },
        logo: { type: DataTypes.STRING(255) },
        logo_light: { type: DataTypes.STRING(255) },
        logo_dark: { type: DataTypes.STRING(255) },
        favicon: { type: DataTypes.STRING(255) },
        school_icon: { type: DataTypes.STRING(255) },
        principal_name: { type: DataTypes.STRING(150) },
        principal_title: { type: DataTypes.STRING(100) },
        principal_nip: { type: DataTypes.STRING(50) },
        acting_principal_name: { type: DataTypes.STRING(150) },
        acting_principal_title: { type: DataTypes.STRING(100) },
        acting_principal_nip: { type: DataTypes.STRING(50) },
        description: { type: DataTypes.TEXT }
    }, {
        sequelize,
        modelName: 'SchoolProfile',
        tableName: 'school_profiles',
        underscored: true
    });

    return SchoolProfile;
};
