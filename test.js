//console.log(require('crypto').randomBytes(64).toString('hex'))

//userid
// "67077cdb15b063d46b93d956"


//creator_portfolio_id
// "67077eb615b063d46b93d995"

const test = require("./utiils/Deletes/deleteAcceptsBook")
let play = async ()=>{
 await test()


}

play().then((data)=>console.log("finish"))





