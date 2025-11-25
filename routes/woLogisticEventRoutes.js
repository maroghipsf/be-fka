const express = require('express');
const router = express.Router();
const controller = require('../controllers/woLogisticEventsController');

// GET /wo-logistic-events?wo_id=xxx
router.get('/', controller.getLogisticEvents);

// GET /wo-logistic-events/:event_id
router.get('/:event_id', controller.getLogisticEventById);

// POST /wo-logistic-events
router.post('/', controller.createLogisticEvent);

// PUT /wo-logistic-events/:event_id
router.put('/:event_id', controller.updateLogisticEvent);

// DELETE /wo-logistic-events/:event_id
router.delete('/:event_id', controller.deleteLogisticEvent);

module.exports = router;
