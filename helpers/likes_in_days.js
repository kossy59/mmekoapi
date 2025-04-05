let likedb = require("../Models/like")
let postdb = require("../Models/post")

  let likes_history = async (userid)=>{
  let like = [] 


    let post = await postdb.find({userid : userid}).exec()

    for(let i = 0; i < post.length; i++){

        let likes = await likedb.find({postid : post[i]._id})

        likes.forEach(value =>{
            
                like.push(value)
            
        })
    }
   

    let first1 = Date.now()

    let first = new Date(Number(first1))

    let first2 = new Date(Number(first1))


    let last = new Date( first2.setDate(first2.getDate() - 28 ) )

  

    let like_count = 0;

    like.forEach(value =>{
        if( new Date(value._id.getTimestamp()) <= first && new Date(value._id.getTimestamp()) > last  ){
            like_count++
        }
    })

    return like_count

}

module.exports = likes_history