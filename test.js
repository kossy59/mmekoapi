//console.log(require('crypto').randomBytes(64).toString('hex'))

//userid
// "67077cdb15b063d46b93d956"


//modelid
// "67077eb615b063d46b93d995"

const test = require("./helpers/earning_in_month")
let play = async ()=>{
 await test('67077cdb15b063d46b93d956')


}

play().then((data)=>console.log("finish"))





