'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class DocumentSetting extends Model {
        static associate(models) {
            DocumentSetting.belongsTo(models.SchoolProfile, {
                foreignKey: 'school_profile_id',
                as: 'schoolProfile'
            });
        }
    }

    DocumentSetting.init({
        school_profile_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        document_type: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        header_image: { type: DataTypes.STRING(255), allowNull: true },
        footer_image: { type: DataTypes.STRING(255), allowNull: true },
        signature_image: { type: DataTypes.STRING(255), allowNull: true },
        stamp_image: { type: DataTypes.STRING(255), allowNull: true },
        signer_name: { type: DataTypes.STRING(150), allowNull: true },
        signer_title: { type: DataTypes.STRING(100), allowNull: true },
        signer_nip: { type: DataTypes.STRING(50), allowNull: true },
        city: { type: DataTypes.STRING(100), allowNull: true },
        letter_number_prefix: { type: DataTypes.STRING(50), allowNull: true },
        letter_number_format: { type: DataTypes.STRING(150), allowNull: true },
        default_subject: { type: DataTypes.STRING(150), allowNull: true },
        default_recipient: { type: DataTypes.STRING(150), allowNull: true },
        default_cc: { type: DataTypes.TEXT, allowNull: true },
        watermark_text: { type: DataTypes.STRING(150), allowNull: true },
        watermark_image: { type: DataTypes.STRING(255), allowNull: true },
        pdf_footer_text: { type: DataTypes.TEXT, allowNull: true },
        show_qr_verification: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        verification_base_url: { type: DataTypes.STRING(255), allowNull: true },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    }, {
        sequelize,
        modelName: 'DocumentSetting',
        tableName: 'document_settings',
        underscored: true
    });

    return DocumentSetting;
};
