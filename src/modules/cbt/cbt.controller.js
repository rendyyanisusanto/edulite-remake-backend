'use strict';
const cbtService = require('./cbt.service');
const logger = require('../../core/logger') || console;

exports.getHealth = async (req, res, next) => {
    try {
        res.json({
            success: true,
            message: "Modul CBT aktif",
            data: {
                module: "CBT",
                status: "READY",
                serverTime: new Date().toISOString()
            }
        });
    } catch (error) {
        if (logger.error) {
            logger.error(`Error in getHealth CBT: ${error.message}`);
        } else {
            console.error(error);
        }
        next(error);
    }
};

exports.getDashboardSummary = async (req, res, next) => {
    try {
        const summary = await cbtService.getDashboardSummary();
        res.json({
            success: true,
            message: "Ringkasan CBT berhasil diambil",
            data: summary
        });
    } catch (error) {
        if (logger.error) {
            logger.error(`Error in getDashboardSummary CBT: ${error.message}`);
        } else {
            console.error(error);
        }
        next(error);
    }
};
