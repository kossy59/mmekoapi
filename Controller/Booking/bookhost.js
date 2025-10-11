const bookingdb = require("../../Creators/book")
const userdb = require("../../Creators/userdb")
const creatordb = require("../../Creators/creators")
const historydb = require("../../Creators/mainbalance")
let sendEmail = require("../../utiils/sendEmailnot")
let sendpushnote = require("../../utiils/sendPushnot")

const createLike = async (req,res)=>{
     
    const userid = req.body.userid;
    let creator_portfoliio_Id = req.body.creator_portfoliio_Id;
    const type = req.body.type;
    const time = req.body.time
    const place = req.body.place
    const date = req.body.date
    const price = req.body.price
   
    if(!creator_portfoliio_Id  && !userid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }
    //console.log('untop init db')

    //let data = await connectdatabase()

    try{
         const user = await userdb.findOne({_id:userid}).exec()

         let userbalance = parseFloat(user.balance)

         let creatorprice = parseFloat(price)

         if(!userbalance){
            userbalance = 0
         }

         let creatoremail = await creatordb.findOne({_id:creator_portfoliio_Id}).exec()

         
        if(type !== "Private show"){

            let total = userbalance - creatorprice

            let clienthistory = {
               userid,
               details: "Creator request pending",
               spent: `${creatorprice}`,
               income: "0",
               date: `${Date.now().toString()}`
            }

            if (total < 0 || total === 0) {
                return res.status(400).json({"ok":false,'message': 'insuffciate balance!!'})
            }
              
            // Deduct from balance and add to pending
            user.balance = String(total)
            user.pending = String((parseFloat(user.pending) || 0) + creatorprice)
   
            user.save()
   
            await historydb.create(clienthistory)

        }
        
        

        
         //console.log("user balance "+userbalance)

         await sendEmail(creatoremail.userid, "Accept appointment")
         await sendpushnote(creatoremail.userid,"Accept appointment","creatoricon")

       let books  = {
            userid,
            creator_portfoliio_Id,
            type,
            place,
            time,
            status:"request",
            date,
            price: creatorprice,
            expiresAt: new Date(Date.now() + 23 * 60 * 60 * 1000 + 14 * 60 * 1000) // 23h 14m from now
        }

        await bookingdb.create(books)
       
            return res.status(200).json({"ok":true,"message":`booking Success`})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createLike