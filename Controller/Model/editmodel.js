const models = require("../../Models/models")
const {
  updateManyFileToAppwrite
} = require("../../utiils/appwrite")

const createModel = async (req, res) => {
    console.log("req.body.data", req.body.data);
    const data = JSON.parse(req.body.data);
    console.log("data", data);

    let hostid = data.hostid;
    let age = data.age
    let location = data.location
    let price = data.price
    let duration = data.duration
    let bodytype = data.bodytype
    let smoke = data.smoke
    let interestedin = data.interestedin
    let height = data.height
    let weight = data.weight
    let description = data.description
    let gender = data.gender
    let timeava = data.timeava
    let daysava = data.daysava
    let drink = data.drink
    let hosttype = data.hosttype
    // photolink = data.photolink

    if (!hostid) {
        return res.status(400).json({
            "ok": false,
            'message': 'User Id invalid!!'
        })
    }

    let currentuser = await models.findOne({
        _id: hostid
    }).exec()

    if (!currentuser) {
        return res.status(409).json({
            "ok": false,
            "message": `User can not edit model`
        })
    }

    let publicIDs = []

    if (currentuser.modelfiles.length > 0) {
        const modelfilepublicids = currentuser.modelfiles.map(modelfile => {
            return modelfile.modelfilepublicid;
        })

        publicIDs = modelfilepublicids
    }

    /**
     * This implementation allows for in memory file upload manipulation
     * This prevents accessing the filesystem of the hosted server
     */
    let results = []

    if (req.files || req.files.length > 2) {
        results = await updateManyFileToAppwrite(publicIDs, req.files, `model`);
    }

    console.log("results: ", results)

    let modelfiles = [];

    // Clean up uploaded file for database storage
    if (results && results.length !== 0) {
        const databaseReady = results.map(result => {
            return ({
                modelfilelink: result.file_link,
                modelfilepublicid: result.public_id,
            })
        })
        modelfiles = databaseReady;
    }

    console.log("modelfiles: ", modelfiles)

    //let data = await connectdatabase()

    try {
        const age1 = currentuser.age
        const location1 = currentuser.location
        const price1 = currentuser.price
        const duration1 = currentuser.duration
        const bodytype1 = currentuser.bodytype
        const smoke1 = currentuser.smoke
        const interestedin1 = currentuser.interestedin
        const height1 = currentuser.height
        const weight1 = currentuser.weight
        const description1 = currentuser.description
        const gender1 = currentuser.gender
        const timeava1 = currentuser.timeava
        const daysava1 = currentuser.daysava
        const drink1 = currentuser.drink
        const hosttype1 = currentuser.hosttype
        const initialModelFiles = currentuser.modelfiles

        if (!age) {
            age = age1
        }

        if (!location1) {
            location = location1
        }
        if (!price) {
            price = price1
        }
        if (!duration) {
            duration = duration1
        }
        if (!bodytype) {
            bodytype = bodytype1
        }
        if (!smoke) {
            smoke = smoke1
        }
        if (!interestedin) {
            interestedin = interestedin1
        }
        if (!height) {
            height = height1
        }
        if (!weight) {
            weight = weight1
        }
        if (!description) {
            description = description1
        }
        if (!gender) {
            gender = gender1
        }
        if (!timeava) {
            timeava = timeava1
        }
        if (!daysava) {
            daysava = daysava1
        }
        if (!drink) {
            drink = drink1
        }
        if (!hosttype) {
            hosttype = hosttype1
        }
        if (!modelfiles) {
            currentuser.modelfiles = initialModelFiles
        }

        currentuser.age = age;
        currentuser.location = location
        currentuser.price = price;
        currentuser.duration = duration
        currentuser.bodytype = bodytype;
        currentuser.smoke = smoke;
        currentuser.drink = drink;
        currentuser.interestedin = interestedin;
        currentuser.height = height;
        currentuser.weight = weight;
        currentuser.description = description
        currentuser.gender = gender;
        currentuser.timeava = timeava
        currentuser.daysava = daysava
        currentuser.hosttype = hosttype;

        if (modelfiles) {
            currentuser.modelfiles = modelfiles
        }

        currentuser.save()



        // await data.databar.updateDocument(data.dataid,data.modelCol,currentuser._id,currentuser)


        return res.status(200).json({
            "ok": true,
            "message": `Model Update successfully`
        })


    } catch (err) {
        return res.status(500).json({
            "ok": false,
            'message': `${err.message}!`
        });
    }
}

module.exports = createModel
