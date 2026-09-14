const { permissionMiddleware } = require('../src/core/middleware/permission.middleware');

async function test() {
    process.env.JWT_SECRET = 'edulite_secret'; // Assuming default or doesn't matter since we mock req.user directly
    const req = {
        user: { id: 6 } // 'rys'
    };

    let resObj = {};
    const res = {
        status: function (code) {
            resObj.status = code;
            return this;
        },
        json: function (data) {
            resObj.data = data;
            console.log('Response:', resObj);
            process.exit();
        }
    };

    const next = () => {
        console.log('Passed successfully! next() called.');
        process.exit();
    };

    const mw = permissionMiddleware('cbt.question_bank.view');
    await mw(req, res, next);
}

test();
