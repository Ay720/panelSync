const express = require('express');
const { getDashboardStats, getDetailedAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/detailed', getDetailedAnalytics);

module.exports = router;

