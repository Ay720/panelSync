const express = require('express');
const {
  getAvailabilityByInterviewer,
  updateWeeklySchedule,
  addDateOverride,
  removeDateOverride,
} = require('../controllers/availabilityController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/interviewer/:interviewerId', getAvailabilityByInterviewer);
router.put('/interviewer/:interviewerId', updateWeeklySchedule);
router.post('/interviewer/:interviewerId/overrides', addDateOverride);
router.delete('/interviewer/:interviewerId/overrides/:date', removeDateOverride);

module.exports = router;

