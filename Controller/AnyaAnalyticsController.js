const Story = require('../models/Story');

/**
 * Get Anya Analytics
 * Provides comprehensive analytics for AI-generated stories
 */
const getAnyaAnalytics = async (req, res) => {
    try {
        const { period = '7days' } = req.query;

        // Calculate date range based on period
        const now = new Date();
        let startDate;

        switch (period) {
            case 'today':
                startDate = new Date(now.setHours(0, 0, 0, 0));
                break;
            case '7days':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                startDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            case '3months':
                startDate = new Date(now.setMonth(now.getMonth() - 3));
                break;
            case '6months':
                startDate = new Date(now.setMonth(now.getMonth() - 6));
                break;
            case 'year':
                startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
            case 'all':
                startDate = new Date(0); // Beginning of time
                break;
            default:
                startDate = new Date(now.setDate(now.getDate() - 7));
        }

        // Fetch all stories in the date range
        const stories = await Story.find({
            createdAt: { $gte: startDate }
        }).sort({ createdAt: -1 });

        // Calculate summary statistics
        const totalViews = stories.reduce((sum, story) => sum + (story.views || 0), 0);
        const totalLikes = stories.reduce((sum, story) => sum + (story.likes || 0), 0);
        const totalComments = stories.reduce((sum, story) => sum + (story.comments?.length || 0), 0);
        const totalStories = stories.length;

        // Find most liked story
        const mostLikedStory = stories.reduce((max, story) =>
            (story.likes || 0) > (max.likes || 0) ? story : max
            , stories[0] || null);

        // Find most viewed story
        const mostViewedStory = stories.reduce((max, story) =>
            (story.views || 0) > (max.views || 0) ? story : max
            , stories[0] || null);

        // Find most commented story
        const mostCommentedStory = stories.reduce((max, story) =>
            (story.comments?.length || 0) > (max.comments?.length || 0) ? story : max
            , stories[0] || null);

        // Calculate daily data
        const dailyDataMap = new Map();

        stories.forEach(story => {
            const storyDate = new Date(story.createdAt);
            const dayKey = storyDate.toISOString().split('T')[0];

            if (!dailyDataMap.has(dayKey)) {
                dailyDataMap.set(dayKey, {
                    date: storyDate,
                    dayKey: dayKey,
                    day: storyDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                    views: 0,
                    likes: 0,
                    comments: 0,
                    stories: 0
                });
            }

            const dayData = dailyDataMap.get(dayKey);
            dayData.views += story.views || 0;
            dayData.likes += story.likes || 0;
            dayData.comments += story.comments?.length || 0;
            dayData.stories += 1;
        });

        // Convert map to array and sort by date
        const dailyData = Array.from(dailyDataMap.values())
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        // Find peak engagement day
        const peakDay = dailyData.reduce((max, day) =>
            (day.views + day.likes + day.comments) > (max.views + max.likes + max.comments) ? day : max
            , dailyData[0] || { day: 'N/A', views: 0, likes: 0, comments: 0 });

        // Top 10 stories by different metrics
        const topStoriesByLikes = stories
            .sort((a, b) => (b.likes || 0) - (a.likes || 0))
            .slice(0, 10)
            .map((story, index) => ({
                rank: index + 1,
                id: story._id,
                title: story.title,
                emotional_core: story.emotional_core,
                likes: story.likes || 0,
                views: story.views || 0,
                comments: story.comments?.length || 0,
                createdAt: story.createdAt
            }));

        const topStoriesByViews = stories
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 10)
            .map((story, index) => ({
                rank: index + 1,
                id: story._id,
                title: story.title,
                emotional_core: story.emotional_core,
                likes: story.likes || 0,
                views: story.views || 0,
                comments: story.comments?.length || 0,
                createdAt: story.createdAt
            }));

        const topStoriesByComments = stories
            .sort((a, b) => (b.comments?.length || 0) - (a.comments?.length || 0))
            .slice(0, 10)
            .map((story, index) => ({
                rank: index + 1,
                id: story._id,
                title: story.title,
                emotional_core: story.emotional_core,
                likes: story.likes || 0,
                views: story.views || 0,
                comments: story.comments?.length || 0,
                createdAt: story.createdAt
            }));

        // Calculate engagement rate (likes + comments) / views
        const avgEngagementRate = totalViews > 0
            ? ((totalLikes + totalComments) / totalViews * 100).toFixed(2)
            : 0;

        // Response data
        res.json({
            ok: true,
            data: {
                selectedPeriod: period,
                summary: {
                    totalStories,
                    totalViews,
                    totalLikes,
                    totalComments,
                    avgViewsPerStory: totalStories > 0 ? (totalViews / totalStories).toFixed(2) : 0,
                    avgLikesPerStory: totalStories > 0 ? (totalLikes / totalStories).toFixed(2) : 0,
                    avgCommentsPerStory: totalStories > 0 ? (totalComments / totalStories).toFixed(2) : 0,
                    engagementRate: avgEngagementRate,
                    peakEngagementDay: {
                        day: peakDay.day,
                        totalEngagement: peakDay.views + peakDay.likes + peakDay.comments
                    },
                    mostLikedStory: mostLikedStory ? {
                        id: mostLikedStory._id,
                        title: mostLikedStory.title,
                        likes: mostLikedStory.likes
                    } : null,
                    mostViewedStory: mostViewedStory ? {
                        id: mostViewedStory._id,
                        title: mostViewedStory.title,
                        views: mostViewedStory.views
                    } : null,
                    mostCommentedStory: mostCommentedStory ? {
                        id: mostCommentedStory._id,
                        title: mostCommentedStory.title,
                        comments: mostCommentedStory.comments?.length || 0
                    } : null
                },
                dailyData,
                topStoriesByLikes,
                topStoriesByViews,
                topStoriesByComments
            }
        });

    } catch (error) {
        console.error('Error fetching Anya analytics:', error);
        res.status(500).json({
            ok: false,
            message: 'Failed to fetch Anya analytics',
            error: error.message
        });
    }
};

module.exports = {
    getAnyaAnalytics
};
