const userdb = require("../../Creators/userdb");
const jwt = require("jsonwebtoken");

const checkBanStatus = async (req, res) => {
    try {
        // Check for both auth_token (from direct login) and session (from Next.js session)
        let token = req.cookies.auth_token;
        let userId = null;
        
        // If no auth_token, check for session cookie (Next.js session)
        if (!token && req.cookies.session) {
            try {
                const jwt = require("jsonwebtoken");
                const sessionData = jwt.verify(req.cookies.session, process.env.ACCESS_TOKEN_SECRET || "NEXT_PUBLIC_SECERET");
                
                if (sessionData.user && sessionData.user.userId) {
                    userId = sessionData.user.userId;
                }
            } catch (sessionError) {
                // Session verification failed
            }
        }
        
        // If we have auth_token, verify it to get userId
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.userId || decoded.UserInfo?.userId;
            } catch (jwtError) {
                token = null;
            }
        }
        
        // 1. If no token and no userId, return unauthorized
        if (!token && !userId) {
            return res.status(401).json({ 
                isAuthenticated: false, 
                message: 'No valid token provided' 
            });
        }

        try {
            // 2. Look up user status in the database using userId
            const user = await userdb.findOne({ _id: userId }).exec();
            
            if (!user) {
                return res.status(401).json({ 
                    isAuthenticated: false, 
                    message: 'User not found' 
                });
            }

            if (user.banned) {
                // **CRUCIAL STEP: FORCED LOGOUT**
                // Clear both auth_token and session cookies
                res.cookie('auth_token', '', {
                    expires: new Date(0),
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'Lax'
                });
                
                res.cookie('session', '', {
                    expires: new Date(0),
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'Lax'
                });
                
                return res.status(403).json({ 
                    isAuthenticated: false, 
                    isBanned: true, 
                    message: 'This account has been banned for violating our rules',
                    banReason: user.banReason || "Violation of terms of service",
                    bannedAt: user.bannedAt
                });
            }

            // 4. User is valid and not banned
            return res.status(200).json({ 
                isAuthenticated: true, 
                isBanned: false, 
                userId: user._id,
                nickname: user.nickname
            });

        } catch (dbError) {
            return res.status(500).json({ 
                isAuthenticated: false, 
                message: 'Database error' 
            });
        }

    } catch (error) {
        res.status(500).json({ 
            isAuthenticated: false, 
            message: 'Internal server error' 
        });
    }
};

module.exports = checkBanStatus;
