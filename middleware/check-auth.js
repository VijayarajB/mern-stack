// To validate an incoming request from a token . If token is not valid it won't process the placesroutes.js

const jwt = require('jsonwebtoken');
const HttpError = require("../models/http_error");

module.exports = (req, res, next) => {
    // App.js - Authorization  // It will be like authorization: 'Bearer TOKEN'
    // Splitting the token and the bearer and taking the token from the first array.

    if(req.method === 'OPTIONS'){  // Browser will throw error for POST request so we use this
        return next();
    }
    
    try{
        const token = req.headers.authorization.split(' ')[1];
    if(!token){
        throw new Error('Authentication Failed');
        } 
        const decodedToken = jwt.verify(token, process.env.JWT_KEY);  // Secret key should be the same as in userscontrollers.js
        req.userData = {userId: decodedToken.userId};
        next();
    }

    catch(err){
        const error = new HttpError('Authentication Failed', 403);
        return next(error);
    }
      
};
