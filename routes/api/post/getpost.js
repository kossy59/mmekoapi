const express = require('express');
const mongoose = require('mongoose'); // <--- ADD THIS
const router = express.Router();
const readPost = require('../../../Controller/Post/Getpost');
const postdbs = require("../../../Creators/post");
const { deleteFile } = require('../../../utiils/appwrite');

router.route('/')
    .post(readPost);

router.route('/:pid')
    .get(async (req, res) => {
        try {
            console.log("Incoming PID:", req.params.pid);

            if (!mongoose.Types.ObjectId.isValid(req.params.pid)) {
                return res.status(400).send("Invalid post id");
            }

            const thePost = await postdbs.aggregate([
                { $match: { _id: new mongoose.Types.ObjectId(req.params.pid) } },

                { $addFields: { useridObj: { $toObjectId: "$userid" } } },

                {
                    $lookup: {
                        from: "userdbs",
                        localField: "useridObj",
                        foreignField: "_id",
                        as: "user"
                    }
                },
                { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

                {
                    $lookup: {
                        from: "likes",
                        localField: "_id",
                        foreignField: "postid",
                        as: "likes"
                    }
                },
                {
                    $lookup: {
                        from: "comments",
                        localField: "_id",
                        foreignField: "postid",
                        as: "comments"
                    }
                },

                {
                    $project: {
                        userid: 1,
                        postfilelink: 1,
                        postfilepublicid: 1,
                        posttime: 1,
                        content: 1,
                        posttype: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        likes: 1,
                        comments: 1,
                        user: {
                            _id: 1,
                            firstname: 1,
                            lastname: 1,
                            nickname: 1,
                            gender: 1,
                            country: 1,
                            age: 1,
                            followers: 1,
                            following: 1,
                            creator_portfolio: 1,
                            creator_portfoliio_Id: 1,
                            creator_verified: 1,
                            photolink: 1,
                            photoID: 1
                        }
                    }
                }
            ]);

            console.log("Aggregate result:", JSON.stringify(thePost, null, 2));

            const postWithJoins = thePost[0] || null;

            if (!postWithJoins?._id) {
                return res.status(404).send("No such post");
            }

            res.status(200).json(postWithJoins);
        } catch (err) {
            console.error("Error fetching post:", err);
            res.status(500).send("Server error");
        }
    }).put(async (req, res) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.pid)) {
                return res.status(400).send("Invalid post id");
            }

            const thePost = await postdbs.findOne({ "_id": req.params.pid });
            const goodKeys = Object.keys(thePost._doc);
            const updateData = {};
            for (const key of Object.keys(req.body)) {
                if (goodKeys.includes(key)) {
                    updateData[key] = req.body[key];
                }
            }
            try {
                const result = await postdbs.updateOne(
                    { _id: req.params.pid },
                    { $set: { content: updateData.content } }
                );

                if (result.matchedCount === 0) {
                    return res.status(404).send("No such post found");
                }

                res.status(200).json(result);
            } catch (err) {
                console.error("Error updating post:", err);
                res.status(500).send("Server error");
            }
        } catch (err) {
            console.error("Error fetching post:", err);
            res.status(500).send("Server error");
        }
    }).delete(async (req, res) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.pid)) {
                return res.status(400).send("Invalid post id");
            }
            const thePost = (await postdbs.findOne({ "_id": req.params.pid }))?._doc;
            if (!thePost?._id) {
                return res.status(404).send("ENOENT: No such post");
            }
            thePost?.postfilepublicid && (await deleteFile(thePost?.postfilepublicid, "post"));
            const del = await postdbs.deleteOne({ "_id": req.params.pid });
            if (del.deletedCount === 0) {
                return res.status(404).send("No such post");
            }
            res.status(200).json({ message: "Post deleted", result: del });
        } catch (err) {
            console.error("Error deleting post:", err);
            res.status(500).send("Server error");
        }
    });

module.exports = router;
