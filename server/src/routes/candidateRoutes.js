const express = require('express');
const { body } = require('express-validator');
const {
  getCandidates,
  getCandidateById,
  createCandidate,
  updateCandidate,
  deleteCandidate,
} = require('../controllers/candidateController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/', getCandidates);
router.get('/:id', getCandidateById);

router.post(
  '/',
  authorize('admin', 'hr'),
  [
    body('name').trim().notEmpty().withMessage('Candidate name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('jobRole').trim().notEmpty().withMessage('Job role is required'),
    validate,
  ],
  createCandidate
);

router.put('/:id', authorize('admin', 'hr'), updateCandidate);
router.delete('/:id', authorize('admin', 'hr'), deleteCandidate);

module.exports = router;

