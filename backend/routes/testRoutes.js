const express = require('express');
const router = express.Router();
const { createTest, getAllTests, updateTest, deleteTest } = require('../controllers/testController');

router.post('/', createTest);
router.get('/', getAllTests);
router.put('/:id', updateTest);
router.delete('/:id', deleteTest);

module.exports = router;
