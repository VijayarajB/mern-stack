const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require ('body-parser');
const HttpError = require('./models/http_error');
const mongoose = require('mongoose');

const placesRoutes = require('./routes/places_routes');

const usersRoutes = require ('./routes/users_routes');

const app = express();

app.use(bodyParser.json());

app.use('/uploads/images', express.static(path.join('uploads', 'images'))); // This won't execute it will just return it

app.use(express.static(path.join('public'))); // To Deploy Combined app-This won't work for different routes we had used so check line 33

// Commented CORSE Headers as we don't require when deploying it as a combined app
// To Avoid CORSE Error in the browser.
// app.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Access-Control-Allow-Headers', 'Origin , X-Requested-With, Content-Type, Accept, Authorization');
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
//     next();
// });

app.use( '/api/places',placesRoutes); // => /api/places/.. only call placeRoutes 
 

app.use('/api/users',usersRoutes);
// To work with different routes for the combined app we use this middleware.
app.use((req, res, next) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html' ));  
    //__dirname is a constant available in node & express which gived the current folder of app.js
})
// Below Middleware is commented bcoz we are deploying as a combined app(Frontend + Backend)
// app.use((req, res, next) => {
//     const error = new HttpError('Could not find this route.', 404)
//     throw error;
// });

//to handle errors
app.use((error, req, res, next) => {
    // If the requested file has went wrong we will rollback the process without storing the image locally
    if(req.file){
        fs.unlink(req.file.path, err => {
            console.log(err);
        });
    }
    if(res.headerSent) {
        return next(error);
    }
    res.status(error.code || 500);
    res.json({message: error.message || 'An unknown Error occured!'});
});

mongoose
    .connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.o4zjfx2.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`)
    .then(() => { 
        app.listen(process.env.PORT || 5000);
    })
    .catch(err => {
        console.log(err);
    });

  