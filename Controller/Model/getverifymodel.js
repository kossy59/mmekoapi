const models = require("../../Models/models")
const userdb = require("../../Models/userdb")

const createModel = async (req, res) => {
    try {
        let currentuser = await models.find({
            verify: "live"
        }).exec()

        let useronline = await userdb.find().exec()

        if (!currentuser[0]) {
            return res.status(200).json({
                "ok": false,
                "message": `user host empty`,
                host: []
            })
        }

        let host = []

        for (let i = 0; i < useronline.length; i++) {
            for (let j = 0; j < currentuser.length; j++) {
                if (String(currentuser[j].userid) === String(useronline[i]._id)) {
                    const photolink = currentuser[j].modelfiles.map(modelfile => {
                        return modelfile.modelfilelink;
                    })

                    listofhost = {
                        hostid: currentuser[j]._id,
                        photolink,
                        verify: currentuser[j].verify,
                        name: currentuser[j].name,
                        age: currentuser[j].age,
                        location: currentuser[j].location,
                        price: currentuser[j].price,
                        duration: currentuser[j].duration,
                        bodytype: currentuser[j].bodytype,
                        smoke: currentuser[j].smoke,
                        drink: currentuser[j].drink,
                        interestedin: currentuser[j].interestedin.join(" "),
                        height: currentuser[j].height,
                        weight: currentuser[j].weight,
                        description: currentuser[j].description,
                        gender: currentuser[j].gender,
                        timeava: currentuser[j].timeava.join(" "),
                        daysava: currentuser[j].daysava.join(" "),
                        hosttype: currentuser[j].hosttype,
                        online: useronline[i].active,
                        userid: currentuser[j].userid,
                        amount: currentuser[j].price
                    }

                    host.push(listofhost)

                }
            }
        }




        return res.status(200).json({
            "ok": true,
            "message": `Model Fetched successfully`,
            host
        })


    } catch (err) {
        return res.status(500).json({
            "ok": false,
            'message': `${err.message}!`
        });
    }
}

module.exports = createModel
