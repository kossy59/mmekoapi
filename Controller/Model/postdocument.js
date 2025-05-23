const documentdb = require("../../Models/document")
const admindb = require("../../Models/admindb")
const {
    uploadManyFilesToCloudinary
} = require("../../utiils/appwrite")

const createModel = async (req, res) => {
    console.log("Trying to verify a form: ", req.body)
    const data = JSON.parse(req.body.data);
    console.log("data", data);

    // If user did not all the needed documents, return an error
    if (!req.files || req.files.length !== 2) {
        return res.status(400).json({
            "ok": false,
            'message': 'You must upload all documents'
        })
    }

    // {} object field names
    const userid = data.userid
    let firstname = data.firstname
    let lastname = data.lastname
    let email = data.email
    let dob = data.dob
    let country = data.country
    let city = data.city
    let address = data.address
    let documentType = data.documentType
    // let holdingIdPhotofile = req.body.holdingIdPhotofile
    // let idPhotofile = req.body.idPhotofile
    let idexpire = data.idexpire

    if (!userid && !firstname && !lastname && !email && !dob && !country && !city && !address && !documentType && !idexpire) {
        return res.status(400).json({
            "ok": false,
            'message': 'user Id invalid!!'
        })
    }

    // console.log("Uploaded documents: ", req.files)

    /**
     * This implementation allows for in memory file upload manipulation
     * This prevents accessing the filesystem of the hosted server
     */
    let results = await uploadManyFilesToCloudinary(req.files, `assets/document/${documentType}s`);

    console.log("results from cloudinary: ", results)

    let holdingIdPhotofile = {}
    let idPhotofile = {}

    // Get uploaded file details
    if (results && results.length > 1) {
        results.forEach(result => {
            if (result.filename === "holdingIdPhotofile") {
                holdingIdPhotofile = {
                    holdingIdPhotofilelink: result.file_link,
                    holdingIdPhotofilepublicid: result.public_id,
                }
            } else if (result.filename === "idPhotofile") {
                idPhotofile = {
                    idPhotofilelink: result.file_link,
                    idPhotofilepublicid: result.public_id,
                }
            }
        })
    } else {
        // The file upload wasn't successful
        return res.status(400).json({
            "ok": false,
            'message': 'Network error. Retry!'
        })
    }

    console.log("holdingIdPhotofile: ", holdingIdPhotofile, "idPhotofile: ", idPhotofile)

    try {
        let document = {
            userid,
            firstname,
            lastname,
            email,
            dob,
            country,
            city,
            address,
            documentType,
            // holdingIdPhoto,
            // idPhoto,
            idexpire,
            holdingIdPhotofile,
            idPhotofile,
        }

        console.log("Document to be submitted: ", document)

        await documentdb.create(document)

        let respond = {
            userid: userid,
            message: `Your Model Application is under review`,
            seen: true
        }

        await admindb.create(respond)

        // returns ok true if succefully posted
        return res.status(200).json({
            "ok": true,
            "message": `successfully`
        })

    } catch (err) {
        return res.status(500).json({
            "ok": false,
            'message': `${err.message}!`
        });
    }
}

module.exports = createModel
