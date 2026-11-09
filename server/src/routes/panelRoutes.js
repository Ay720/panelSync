const express = require('express');
const { body } = require('express-validator');
const {
  getPanels,
  getPanelById,
  createPanel,
  updatePanel,
  deletePanel,
} = require('../controllers/panelController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/', getPanels);
router.get('/:id', getPanelById);

router.post(
  '/',
  authorize('admin', 'hr'),
  [
    body('name').trim().notEmpty().withMessage('Panel name is required'),
    body('interviewers').isArray({ min: 1 }).withMessage('At least one interviewer must be selected'),
    validate,
  ],
  createPanel
);

router.put('/:id', authorize('admin', 'hr'), updatePanel);
router.delete('/:id', authorize('admin', 'hr'), deletePanel);

module.exports = router;

