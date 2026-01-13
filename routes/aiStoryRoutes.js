const express = require('express');
const router = express.Router();
const {
    generateAndSaveStories,
    getAllStories,
    getStoryById,
    getNextStory,
    deleteStory,
    deleteAllStories,
    likeStory,
    addComment
} = require('../Controller/AiStoryController');
const { getAnyaAnalytics } = require('../Controller/AnyaAnalyticsController');
const { trackPageVisit, getPageVisitAnalytics, startSession, updateSessionActivity, endSession, getUserSessionAnalytics } = require('../Controller/AnyaPageVisitController');

// Generate and save 5 stories
router.post('/generate', generateAndSaveStories);

// Get all stories
router.get('/stories', getAllStories);

// Get single story by ID
router.get('/stories/:id', getStoryById);

// Get next story
router.get('/stories/:id/next', getNextStory);

// Like/Unlike a story
router.post('/stories/:id/like', likeStory);

// Add comment to a story
router.post('/stories/:id/comment', addComment);

// Get Anya Analytics (admin)
router.get('/analytics', getAnyaAnalytics);

// Track page visit
router.post('/track-visit', trackPageVisit);

// Get page visit analytics (admin)
router.get('/visit-analytics', getPageVisitAnalytics);

// Session tracking endpoints
router.post('/session/start', startSession);
router.post('/session/heartbeat', updateSessionActivity);
router.post('/session/end', endSession);
router.get('/session/analytics', getUserSessionAnalytics);

// Delete a single story by ID (admin)
router.delete('/stories/:id', deleteStory);

// Delete all stories (for testing)
router.delete('/stories', deleteAllStories);

module.exports = router;
