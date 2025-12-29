const AnyaPageVisit = require('../models/AnyaPageVisit');

/**
 * Track a page visit to Anya pages
 */
const trackPageVisit = async (req, res) => {
    try {
        const { pageType, storyId, userId, visitorId, referrer } = req.body;

        // Validate required fields
        if (!pageType || !visitorId) {
            return res.status(400).json({
                ok: false,
                message: 'pageType and visitorId are required'
            });
        }

        // Validate pageType
        if (!['main', 'story'].includes(pageType)) {
            return res.status(400).json({
                ok: false,
                message: 'pageType must be either "main" or "story"'
            });
        }

        // If pageType is story, storyId is required
        if (pageType === 'story' && !storyId) {
            return res.status(400).json({
                ok: false,
                message: 'storyId is required for story page visits'
            });
        }

        // Get IP address from request
        const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] ||
            req.headers['x-real-ip'] ||
            req.connection.remoteAddress;

        // Get user agent
        const userAgent = req.headers['user-agent'];

        // Create visit record
        const visit = new AnyaPageVisit({
            pageType,
            storyId: storyId || null,
            userId: userId || null,
            visitorId,
            ipAddress,
            userAgent,
            referrer: referrer || null,
            visitedAt: new Date()
        });

        await visit.save();

        res.json({
            ok: true,
            message: 'Visit tracked successfully',
            visitId: visit._id
        });

    } catch (error) {
        console.error('Error tracking page visit:', error);
        res.status(500).json({
            ok: false,
            message: 'Failed to track visit',
            error: error.message
        });
    }
};

/**
 * Get Anya Page Visit Analytics
 */
const getPageVisitAnalytics = async (req, res) => {
    try {
        const { period = '7days' } = req.query;

        // Calculate date range
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
                startDate = new Date(0);
                break;
            default:
                startDate = new Date(now.setDate(now.getDate() - 7));
        }

        // Fetch all visits in the period
        const visits = await AnyaPageVisit.find({
            visitedAt: { $gte: startDate }
        }).sort({ visitedAt: -1 });

        // Calculate summary statistics
        const totalVisits = visits.length;
        const mainPageVisits = visits.filter(v => v.pageType === 'main').length;
        const storyPageVisits = visits.filter(v => v.pageType === 'story').length;

        // Unique visitors
        const uniqueVisitors = new Set(visits.map(v => v.visitorId)).size;

        // Logged in users
        const loggedInVisits = visits.filter(v => v.userId).length;
        const anonymousVisits = visits.filter(v => !v.userId).length;

        // Calculate daily data
        const dailyDataMap = new Map();

        visits.forEach(visit => {
            const visitDate = new Date(visit.visitedAt);
            const dayKey = visitDate.toISOString().split('T')[0];

            if (!dailyDataMap.has(dayKey)) {
                dailyDataMap.set(dayKey, {
                    date: visitDate,
                    dayKey: dayKey,
                    day: visitDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                    totalVisits: 0,
                    mainPageVisits: 0,
                    storyPageVisits: 0,
                    uniqueVisitors: new Set()
                });
            }

            const dayData = dailyDataMap.get(dayKey);
            dayData.totalVisits += 1;
            if (visit.pageType === 'main') dayData.mainPageVisits += 1;
            if (visit.pageType === 'story') dayData.storyPageVisits += 1;
            dayData.uniqueVisitors.add(visit.visitorId);
        });

        // Convert map to array and process
        const dailyData = Array.from(dailyDataMap.values())
            .map(day => ({
                ...day,
                uniqueVisitors: day.uniqueVisitors.size
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        // Find peak day
        const peakDay = dailyData.reduce((max, day) =>
            day.totalVisits > max.totalVisits ? day : max
            , dailyData[0] || { day: 'N/A', totalVisits: 0 });

        // Most visited stories
        const storyVisitCounts = new Map();
        visits.filter(v => v.pageType === 'story' && v.storyId).forEach(visit => {
            const count = storyVisitCounts.get(visit.storyId) || 0;
            storyVisitCounts.set(visit.storyId, count + 1);
        });

        // Fetch story data for likes and views
        const Story = require('../models/Story');
        const stories = await Story.find({}).sort({ createdAt: -1 }).limit(100);

        // Build top visited stories with details
        const topVisitedStoriesWithDetails = await Promise.all(
            Array.from(storyVisitCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(async ([storyId, visits], index) => {
                    const story = stories.find(s => s._id.toString() === storyId);
                    return {
                        rank: index + 1,
                        storyId,
                        title: story?.title || 'Unknown Story',
                        emotional_core: story?.emotional_core || 'N/A',
                        visits
                    };
                })
        );

        // Find most liked story
        const mostLikedStory = stories.reduce((max, story) =>
            (story.likes || 0) > (max.likes || 0) ? story : max
            , stories[0] || null);

        // Find most viewed story
        const mostViewedStory = stories.reduce((max, story) =>
            (story.views || 0) > (max.views || 0) ? story : max
            , stories[0] || null);

        // Response data
        res.json({
            ok: true,
            data: {
                selectedPeriod: period,
                summary: {
                    totalVisits,
                    mainPageVisits,
                    storyPageVisits,
                    uniqueVisitors,
                    avgVisitsPerDay: dailyData.length > 0 ? (totalVisits / dailyData.length).toFixed(2) : 0,
                    mostLikedStory: mostLikedStory ? {
                        id: mostLikedStory._id,
                        title: mostLikedStory.title,
                        likes: mostLikedStory.likes || 0
                    } : null,
                    mostViewedStory: mostViewedStory ? {
                        id: mostViewedStory._id,
                        title: mostViewedStory.title,
                        views: mostViewedStory.views || 0
                    } : null
                },
                dailyData,
                topVisitedStories: topVisitedStoriesWithDetails
            }
        });

    } catch (error) {
        console.error('Error fetching page visit analytics:', error);
        res.status(500).json({
            ok: false,
            message: 'Failed to fetch page visit analytics',
            error: error.message
        });
    }
};

module.exports = {
    trackPageVisit,
    getPageVisitAnalytics
};
