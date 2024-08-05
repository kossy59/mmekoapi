import { promises } from 'nodemailer/lib/xoauth2'

const multer = require('multer')

const {GridFsStorage} = require('multer-gridfs-storage')

export function upload(){
    const url = process.env.DB

    const storage = new GridFsStorage({
        url:url,
        file:(req,file)=>{
            return new Promise((resolve,_reject)=>{
                const fileinfo ={
                    filename : file.originalname,
                    bucketName:"fileBucket",
                }
                resolve(fileinfo)
            })
        },
    })

    return multer({storage})
}

module.exports = {upload}