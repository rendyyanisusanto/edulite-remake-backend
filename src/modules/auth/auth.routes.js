'use strict';
const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { authMiddleware } = require('../../core/middleware/auth.middleware');

router.post('/login', authController.login);
router.get('/profile', authMiddleware, authController.profile);

module.exports = router;
