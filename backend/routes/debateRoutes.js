const express = require('express');
const router = express.Router();
const { createDebate, updateDebate, getAllDebates, deleteDebate } = require('../controllers/debateController');
//const auth = require('../middleware/auth');

router.get('/', getAllDebates);
router.post('/', createDebate);
router.put('/:id', updateDebate);
router.delete('/:id', deleteDebate);
module.exports = router;
