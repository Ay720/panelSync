const express = require('express');
const { getUsers, getUserById, updateUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin', 'hr'), getUsers);
router.get('/:id', getUserById);
router.put('/:id', authorize('admin'), updateUser);

module.exports = router;

