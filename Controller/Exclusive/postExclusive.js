let exclusivedb = require("../../Creators/exclusivedb")
const {
    uploadManyFilesToCloudinary
} = require("../../utiils/storj")

const postexclusive = async (req, res) => {
    // console.log("Trying to verify a form: ", req.body)
    const data = JSON.parse(req.body.data);
    console.log("data", data);

    // If user did not all the needed documents, return an error
    if (!req.files || req.files.length !== 2) {
        return res.status(400).json({
            "ok": false,
            'message': 'You must upload all documents'
        })
    }

    const userid = data.userid;
    const content_type = data.content_type;
    // const contentlink = data.contentlink;
    const contentname = data.contentname;
    const price = data.price;
    // const thumblink = data.thumblink;

    if (!userid || !content_type || !contentname || !price) {
        return res.status(400).json({
            "ok": false,
            'message': 'Invalid post details!!'
        })
    }

    /**
     * This implementation allows for in memory file upload manipulation
     * This prevents accessing the filesystem of the hosted server
     */
    let results = await uploadManyFilesToCloudinary(req.files, `post`);

    console.log("results from cloudinary: ", results)

    let contentfile = {}
    let thumbnailfile = {}

     

    // Get uploaded file details
    if (results && results.length > 1) {
        results.forEach(result => {
            if (result.filename === "contentlink") {
                contentfile = {
                    contentfilelink: result.file_link,
                    contentfilepublicid: result.public_id,
                }
            } else if (result.filename === "thumbnaillink") {
                thumbnailfile = {
                    thumbnaillink: result.file_link,
                    thumbnailpublicid: result.public_id,
                }
            }
        })
    } else {
        // The file upload wasn't successful
        return res.status(400).json({
            "ok": false,
            'message': 'Network error. Retry!'
        })
    }

    console.log("holdingIdPhotofile: ", contentfile, "idPhotofile: ", thumbnailfile)

    let exclusive_data = {
        userid,
        content_type,
        contentfile,
        contentname,
        price,
        thumbnailfile
    }

    await exclusivedb.create(exclusive_data)


    return res.status(200).json({
        "ok": true,
        'message': 'exclusive post successfully!!'
    })

}

module.exports = postexclusive;
