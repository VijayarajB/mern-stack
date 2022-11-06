const { validationResult } = require('express-validator');
const HttpError = require('../models/http_error');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// const DUMMY_USERS = [
//     {
//     id:'u1',
//     name: 'Vijayaraj',
//     email: 'vijayaraj.ceiyone@gmail.com',
//     password: 'Vijay1234'
//     }
// ];

// Get Users Route

const getUsers = async(req, res, next) => {
    // For Security we are only find -  Email & Name

    let users;
    try{
        users = await User.find({}, '-password');
    }
    catch(err){
        const error = new HttpError('Fetching Users failed, please try again later', 500);
        return next(error);
    }
    res.json({users: users.map(user => user.toObject({getters:true}))}); // we use map bcoz find returns an array
};


// SignUp Users Route

const signup = async(req,res,next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return next(new HttpError('Invalid Inputs. Please Check the data', 422)); 
    }
    const {name, email, password} = req.body;

    let existingUser;
    try{
       existingUser = await User.findOne({email: email}); 
    }
    catch(err){
        const error = new HttpError('Signing up failed, Please try again later',500);
        return next(error);
    }

    if(existingUser){
        const error = new HttpError('User exists already, Please Login instead',422);
        return next(error);
    }
    
    let hashedPassword;
    try{
        hashedPassword = await bcrypt.hash(password,12);
    }catch(err){
        const error = new HttpError('Could not Create user, Please try again later', 500);
    return next(error);
}
    
    

    const createdUser = new User({
       name,
       email,
       password: hashedPassword,
       image: req.file.path,
       //image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSa69_HGc_i3MXKCPZzCfAjBZC4bXJsn0rS0Ufe6H-ctZz5FbIVaPkd1jCPTpKwPruIT3Q&usqp=CAU',
       places: []
    });                                                     

    try{
        await createdUser.save();
    }
    catch(err){
        const error = new HttpError('Signing up Failed, please try again later', 500);
        return next(error);
    }

    //Generating Token using javawebtoken package 
    let token;
    try{
       token = jwt.sign({userId: createdUser.id, email: createdUser.email}, process.env.JWT_KEY, {expiresIn: '1h'}); 
    }catch(err){
        const error = new HttpError('Signing up Failed, please try again later', 500);
        return next(error);
    }
    


    // res.status(201).json({user: createdUser.toObject({getters:true})}); // It removes underscore that is created in the Id name automatically
    res.status(201).json({userId: createdUser.id, email: createdUser.email, token: token});
};

// Login page Route

const login = async(req, res, next) => {
    const {email, password} = req.body;
    // const identifiedUser = DUMMY_USERS.find(u => u.email === email);
    // if(!identifiedUser || identifiedUser.password !== password) {
    //    return next(new HttpError('Could not Identify User, Please check the credentials!', 401)); 
    // }

    let existingUser;
    try{
       existingUser = await User.findOne({email: email}); 
    }
    catch(err){
        const error = new HttpError('Logging in failed, Please try again later',500);
        return next(error);
    }
  //Just checking existing user exists or not
    // if(!existingUser || existingUser.password !== password){
        if(!existingUser){
        const error = new HttpError("Invalid Credentials, Could not log you in!", 403);
        return next(error);
    }

    // Comparing the user password and existing hashed password using compare function in bcrypt

    let isValidPassword = false;
    try{
       isValidPassword = await bcrypt.compare(password, existingUser.password); 
    } catch(err){
        const error = new HttpError('Could not log you in, please check your credentials and try again later', 500);
        return next(error);
    }
    

    // If isValidPassword is incorrect
    if(!isValidPassword){
        const error = new HttpError("Invalid Credentials, Could not log you in!", 403);
        return next(error);
    }

    //Generating token for Login using javawebtoken

    let token;
    try{
       token = jwt.sign({userId: existingUser.id, email: existingUser.email}, process.env.JWT_KEY, {expiresIn: '1h'}); 
    }catch(err){
        const error = new HttpError('Logging in Failed, please try again later', 500);
        return next(error);
    }

    res.json({
        userId: existingUser.id,
        email: existingUser.email,
        token: token
    });
};


exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;











