const express = require('express');
const { getDashboardStats, getDetailedAnalytics, exportCSV } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/detailed', getDetailedAnalytics);
router.get('/export-csv', exportCSV);

module.exports = router;

