'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('document_settings', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            school_profile_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'school_profiles',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            document_type: {
                type: Sequelize.STRING(50),
                allowNull: false
            },
            header_image: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            footer_image: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            signature_image: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            stamp_image: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            signer_name: {
                type: Sequelize.STRING(150),
                allowNull: true
            },
            signer_title: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            signer_nip: {
                type: Sequelize.STRING(50),
                allowNull: true
            },
            city: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            letter_number_prefix: {
                type: Sequelize.STRING(50),
                allowNull: true
            },
            letter_number_format: {
                type: Sequelize.STRING(150),
                allowNull: true
            },
            default_subject: {
                type: Sequelize.STRING(150),
                allowNull: true
            },
            default_recipient: {
                type: Sequelize.STRING(150),
                allowNull: true
            },
            default_cc: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            watermark_text: {
                type: Sequelize.STRING(150),
                allowNull: true
            },
            watermark_image: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            pdf_footer_text: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            show_qr_verification: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            verification_base_url: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now')
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now')
            }
        });

        // Indexes
        await queryInterface.addIndex('document_settings', ['school_profile_id'], {
            name: 'idx_document_settings_school_profile_id'
        });
        await queryInterface.addIndex('document_settings', ['document_type'], {
            name: 'idx_document_settings_document_type'
        });
        await queryInterface.addIndex('document_settings', ['is_active'], {
            name: 'idx_document_settings_is_active'
        });
        await queryInterface.addIndex('document_settings', ['school_profile_id', 'document_type'], {
            name: 'idx_document_settings_school_doc_type'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('document_settings');
    }
};
