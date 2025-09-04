const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create dynamic multer middleware for multiple file uploads
const dynamicMulter = (req, res, next) => {
    console.log('req dynamicMulter', req.body);  // Log the request body

    // Extract the folderPath and fieldName from the request body
    const folderPath = req.body.folderPath || 'uploads';  // Default to 'uploads' if folderPath not provided
    const fieldName = req.body.fieldName || 'files';      // Default to 'files' if fieldName not provided

    // Ensure the folder exists, if not create it
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
        console.log(`Directory created at: ${folderPath}`); // Log the folder creation
    }

    // Set storage engine for multer
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, folderPath);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    });

    // Create multer instance with dynamic storage configuration for multiple files
    const upload = multer({
        storage: storage,
        limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10 MB
        fileFilter: function (req, file, cb) {
            // Accept image, video, audio, and document files only
            const filetypes = /jpeg|jpg|png|gif|mp4|mp3|wav|pdf|doc|docx/; // Add more types if needed
            const mimetype = filetypes.test(file.mimetype);
            const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

            if (mimetype && extname) {
                return cb(null, true);
            } else {
                cb(new Error('Only image, video, audio, and document files are allowed!'));
            }
        }
    }).array(fieldName);  // Use fieldName from payload dynamically to allow multiple files

    // Execute multer upload function
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // A multer error occurred when uploading.
            return res.status(400).json({
                success: false,
                message: `Multer Error: ${err.message}`
            });
        } else if (err) {
            // An unknown error occurred when uploading.
            return res.status(400).json({
                success: false,
                message: `Error: ${err.message}`
            });
        }

        // If everything is OK, proceed to next middleware or route handler
        next();
    });
};

module.exports = dynamicMulter;
