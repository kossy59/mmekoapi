const { uploadSingleFileToCloudinary } = require('./storj');

/**
 * Upload image buffer to Storj
 * @param {Buffer} buffer - Image buffer
 * @param {string} filename - Filename with extension
 * @param {string} mimetype - MIME type (e.g., 'image/jpeg')
 * @returns {Promise<string>} - Public URL of uploaded image
 */
async function uploadToStorj(buffer, filename, mimetype) {
    try {
        // Create a file object compatible with the storj upload function
        const file = {
            buffer: buffer,
            originalname: filename,
            mimetype: mimetype
        };

        const result = await uploadSingleFileToCloudinary(file, 'post');

        if (result && result.file_link) {
            return result.file_link;
        }

        throw new Error('Failed to get file link from Storj');
    } catch (error) {
        console.error('Error uploading to Storj:', error);
        throw error;
    }
}

module.exports = { uploadToStorj };
