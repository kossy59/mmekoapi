const exclusivePostdata = require("../../Creators/exclusivePost");
const { uploadSingleFileToCloudinary } = require("../../utiils/storj");
const { trackUserAction } = require("../../utiils/trackUserActivity");

const createExclusivePost = async (req, res) => {
  try {
    // Support both: JSON string in req.body.data OR plain fields in req.body
    let data;
    if (req.body && typeof req.body.data === "string") {
      try {
        data = JSON.parse(req.body.data);
      } catch (e) {
        return res.status(400).json({ ok: false, message: "Invalid JSON in 'data' field" });
      }
    } else {
      data = {
        userid: req.body?.userid,
        content: req.body?.content,
        price: req.body?.price,
      };
    }

    const userid = data.userid;
    const content = data.content || "";
    const price = parseFloat(data.price);

    // Validation
    if (!userid) {
      return res.status(400).json({ ok: false, message: "User ID is missing" });
    }

    if (!price || isNaN(price) || price <= 0) {
      return res.status(400).json({ ok: false, message: "Valid price is required" });
    }

    if (!req.file) {
      return res.status(400).json({ ok: false, message: "File is required" });
    }

    // Determine post type based on file mimetype
    let posttype = "image";
    if (req.file.mimetype.startsWith("video/")) {
      posttype = "video";
    } else if (req.file.mimetype.startsWith("image/")) {
      posttype = "image";
    } else {
      return res.status(400).json({ ok: false, message: "Only image or video files are allowed" });
    }

    // Upload file to Storj
    const result = await uploadSingleFileToCloudinary(req.file, "post");

    if (!result.file_link || !result.public_id) {
      return res.status(500).json({ ok: false, message: "File upload failed" });
    }

    // Save post to exclusive posts DB
    const newPost = {
      userid,
      postfilelink: result.file_link,
      postfilepublicid: result.public_id,
      posttime: `${Date.now()}`,
      content,
      posttype,
      price: price,
    };

    const createdPost = await exclusivePostdata.create(newPost);

    // Track user activity (post creation)
    trackUserAction(userid, "post");

    return res.status(200).json({
      ok: true,
      message: "Exclusive post created successfully",
      post: {
        _id: createdPost._id,
        userid: createdPost.userid,
        postfilelink: createdPost.postfilelink,
        postfilepublicid: createdPost.postfilepublicid,
        posttime: createdPost.posttime,
        content: createdPost.content,
        posttype: createdPost.posttype,
        price: createdPost.price,
      },
    });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ ok: false, message: err.message || "Internal error" });
  }
};

module.exports = createExclusivePost;

