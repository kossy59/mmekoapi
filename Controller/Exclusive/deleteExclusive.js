const exclusivePostdb = require("../../Creators/exclusivePost");
const exclusivePostPurchasedb = require("../../Creators/exclusivePostPurchase");

const postexclusive = async(req,res)=>{

    let id = req.body.id;
    

    if(!id){
        return res.status(400).json({"ok":false,'message': 'Invalid exclusive ID!!'})
    }

    try {
        console.log("Deleting exclusive post with id:", id);
        
        // Check if post exists
        const post = await exclusivePostdb.findById(id);
        if (!post) {
            return res.status(404).json({"ok":false,'message': 'Exclusive post not found'});
        }

        // Delete the exclusive post
        const deleteResult = await exclusivePostdb.deleteOne({_id:id}).exec();
        
        if (deleteResult.deletedCount === 0) {
            return res.status(404).json({"ok":false,'message': 'Failed to delete exclusive post'});
        }

        // Also delete all purchase records for this post
        await exclusivePostPurchasedb.deleteMany({postid: id}).exec();

        console.log("Exclusive post deleted successfully:", id);
        return res.status(200).json({"ok":true,'message': 'Exclusive post deleted successfully!!'});

    } catch (error) {
        console.error("Error deleting exclusive post:", error);
        return res.status(500).json({"ok":false,'message': `Error deleting exclusive post: ${error.message}`});
    }

}

module.exports = postexclusive;