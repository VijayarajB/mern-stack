const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const MIME_TYPE_MAP = {
    'image/png' : 'png',
    'image/jpg' : 'jpg',
    'image/jpeg': 'jpeg'
};
// Configuring the destination folder to save the images
const fileUpload = multer({ // It's a Middleware.
    limites: 500000, //In Bytes
    storage: multer.diskStorage({
        destination: (req, file, cb) => {    //cb means callback
            cb(null, 'uploads/images');
        }, 
        // Configuring how the file name is named
        filename: (req, file, cb) => {
            const ext = MIME_TYPE_MAP[file.mimetype];
            cb(null,uuidv4() + '.' + ext );  //file extension with unique ID randomly
        }
    }),
    // What file formats we accept using MIME TYPE above
    fileFilter:(req, file, cb) => {
        const isValid = !!MIME_TYPE_MAP[file.mimetype];  //!! is called double bang operator which returns either true or false
        const error = isValid ? null : new Error('Invalid MIME TYPE!');
        cb(error, isValid);
    }
}); 

module.exports = fileUpload;