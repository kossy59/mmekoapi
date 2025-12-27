const express = require('express');
const router = express.Router();
const {
    generateAndSaveStories,
    getAllStories,
    getStoryById,
    deleteAllStories,
    likeStory,
    addComment
} = require('../Controller/AiStoryController');

// Generate and save 5 stories
router.post('/generate', generateAndSaveStories);

// Get all stories
router.get('/stories', getAllStories);

// Get single story by ID
router.get('/stories/:id', getStoryById);

// Like/Unlike a story
router.post('/stories/:id/like', likeStory);

// Add comment to a story
router.post('/stories/:id/comment', addComment);

// Delete all stories (for testing)
router.delete('/stories', deleteAllStories);

module.exports = router;
