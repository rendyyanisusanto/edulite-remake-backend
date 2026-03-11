const { User, Role, Permission } = require('../../models');

const permissionMiddleware = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized',
                    error_code: 'UNAUTHORIZED'
                });
            }

            // Typically, permissions are fetched during login and included in the token, or we look them up here.
            // Assuming they are looked up here for up-to-date validation
            const user = await User.findByPk(req.user.id, {
                include: [{
                    model: Role,
                    as: 'roles',
                    include: [{
                        model: Permission,
                        as: 'permissions'
                    }]
                }]
            });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User no longer exists',
                    error_code: 'UNAUTHORIZED'
                });
            }

            let hasPermission = false;
            const roles = user.roles || [];

            for (const role of roles) {
                if (role.name === 'SUPERADMIN') {
                    hasPermission = true;
                    break;
                }

                const permissions = role.permissions || [];
                const found = permissions.find(p => p.code === requiredPermission);
                if (found) {
                    hasPermission = true;
                    break;
                }
            }

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: Insufficient permissions',
                    error_code: 'FORBIDDEN'
                });
            }

            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Internal error checking permissions',
                error_code: 'INTERNAL_ERROR'
            });
        }
    };
};

module.exports = { permissionMiddleware };
