const { streamFile, previewFile } = require("../../utiils/storj");

// Enhanced cache: fileId -> { bucket, size, contentType }
const fileMetadataCache = new Map();
const CACHE_MAX_SIZE = 1000;
const CACHE_TTL = 3600000; // 1 hour in milliseconds

// Prioritize buckets by likelihood
const BUCKET_FOLDERS = ['post', 'creator', 'profile', 'message', 'creator-application'];

const streamVideo = async (req, res) => {
    const startTime = Date.now();
    const { fileId } = req.params;
    const range = req.headers.range;

    try {
        let foundFolder = null;
        let fileSize = null;
        let contentType = null;

        // Check cache first
        const cached = fileMetadataCache.get(fileId);
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
            // Use cached metadata - NO S3 call needed!
            foundFolder = cached.bucket;
            fileSize = cached.size;
            contentType = cached.contentType;
            console.log(`⚡ [Video Stream] FULL CACHE HIT for ${fileId} | ${Date.now() - startTime}ms`);
        } else {
            // Cache miss or expired - discover file
            let fileInfo = null;

            for (const folder of BUCKET_FOLDERS) {
                try {
                    fileInfo = await previewFile(fileId, folder);
                    if (fileInfo) {
                        foundFolder = folder;
                        fileSize = fileInfo.size;
                        contentType = fileInfo.contentType || 'video/mp4';

                        // Cache metadata
                        if (fileMetadataCache.size >= CACHE_MAX_SIZE) {
                            const firstKey = fileMetadataCache.keys().next().value;
                            fileMetadataCache.delete(firstKey);
                        }

                        fileMetadataCache.set(fileId, {
                            bucket: foundFolder,
                            size: fileSize,
                            contentType: contentType,
                            timestamp: Date.now()
                        });

                        console.log(`🔍 [Video Stream] Discovered ${fileId} in ${foundFolder} | ${Date.now() - startTime}ms`);
                        break;
                    }
                } catch (err) {
                    // Continue checking
                }
            }
        }

        const discoveryTime = Date.now() - startTime;

        if (!foundFolder || fileSize === null) {
            console.error(`❌ [Video Stream] Not found: ${fileId} | ${discoveryTime}ms`);
            return res.status(404).json({ error: "Video not found" });
        }

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

            if (start >= fileSize || end >= fileSize) {
                return res.status(416).header("Content-Range", `bytes */${fileSize}`).send();
            }

            const chunkSize = (end - start) + 1;
            const streamData = await streamFile(fileId, foundFolder, start, end);

            if (!streamData || !streamData.body) {
                return res.status(500).json({ error: "Failed to retrieve video stream" });
            }

            const headers = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=3600',
            };

            res.writeHead(206, headers);
            console.log(`✅ [Video Stream] Streaming ${fileId} | Total: ${Date.now() - startTime}ms | Discovery: ${discoveryTime}ms`);
            streamData.body.pipe(res);
        } else {
            const streamData = await streamFile(fileId, foundFolder);

            if (!streamData || !streamData.body) {
                return res.status(500).json({ error: "Failed to retrieve video stream" });
            }

            const headers = {
                'Content-Length': fileSize,
                'Content-Type': contentType,
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'public, max-age=3600',
            };

            res.writeHead(200, headers);
            console.log(`✅ [Video Stream] Full ${fileId} | Total: ${Date.now() - startTime}ms`);
            streamData.body.pipe(res);
        }
    } catch (error) {
        console.error("❌ [Video Stream] Error:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
};

module.exports = {
    streamVideo
};
