const express = require('express');
const seedData = require('../scripts/seed');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const result = await seedData();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

