const publicService = require('./public.service');

exports.getStudentDashboard = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { date } = req.query;
        
        // If date is not provided, use today's date in local timezone
        const targetDate = date || new Date().toLocaleString('sv', { timeZone: 'Asia/Jakarta' }).split(' ')[0];

        const data = await publicService.getStudentDashboard(id, targetDate);
        
        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'Student not found',
                data: null
            });
        }
        
        return res.json({
            success: true,
            message: 'Student dashboard retrieved successfully',
            data: data
        });
    } catch (error) {
        next(error);
    }
};
