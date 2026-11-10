const express = require('express');
const { body } = require('express-validator');
const {
  findSmartSlots,
  createInterview,
  getInterviews,
  getInterviewById,
  updateInterview,
  cancelInterview,
  checkConflicts,
  getRescheduleOptions,
  rescheduleInterview,
  downloadICS,
  submitFeedback,
} = require('../controllers/interviewController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Public ICS download route
router.get('/:id/ics', downloadICS);

router.use(protect);

// Smart Scheduling Engine endpoint
router.post('/find-slots', findSmartSlots);

// Core Interviews
router.get('/', getInterviews);
router.post(
  '/',
  authorize('admin', 'hr'),
  [
    body('candidateId').notEmpty().withMessage('Candidate is required'),
    body('scheduledStartTime').isISO8601().withMessage('Valid start time is required'),
    body('scheduledEndTime').isISO8601().withMessage('Valid end time is required'),
    validate,
  ],
  createInterview
);

router.get('/:id', getInterviewById);
router.put('/:id', authorize('admin', 'hr'), updateInterview);
router.post('/:id/cancel', authorize('admin', 'hr'), cancelInterview);
router.post('/:id/feedback', submitFeedback);

// Rescheduling workflows
router.get('/:id/conflicts', checkConflicts);
router.get('/:id/reschedule-options', getRescheduleOptions);
router.post('/:id/reschedule', authorize('admin', 'hr'), rescheduleInterview);

module.exports = router;

