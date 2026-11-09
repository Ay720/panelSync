const express = require('express');
const { body } = require('express-validator');
const {
  getInterviewers,
  getInterviewerById,
  createInterviewer,
  updateInterviewer,
  deleteInterviewer,
  syncCalendar,
} = require('../controllers/interviewerController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/', getInterviewers);
router.get('/:id', getInterviewerById);

router.post(
  '/',
  authorize('admin', 'hr'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('department').trim().notEmpty().withMessage('Department is required'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    validate,
  ],
  createInterviewer
);

router.put('/:id', authorize('admin', 'hr'), updateInterviewer);
router.delete('/:id', authorize('admin', 'hr'), deleteInterviewer);
router.post('/:id/sync-calendar', syncCalendar);

module.exports = router;

