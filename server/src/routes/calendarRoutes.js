const express = require('express');
const {
  getCalendarFeed,
  createEvent,
  deleteEvent,
  syncAllMockCalendars,
} = require('../controllers/calendarController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/feed', getCalendarFeed);
router.post('/events', createEvent);
router.delete('/events/:id', deleteEvent);
router.post('/sync-all', syncAllMockCalendars);

module.exports = router;

