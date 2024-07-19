const {connectdatabase} = require('./connectDB')

async function connect(){
    await connectdatabase()
}

module.exports = connect;