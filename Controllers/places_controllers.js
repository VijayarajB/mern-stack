const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const HttpError = require('../models/http_error');
const { validationResult } = require('express-validator');
const Place = require('../models/place');
const getCoordsForAddress = require('../util/location');
const User = require('../models/user');
const mongoose = require('mongoose');

// let DUMMY_PLACES =[
//     {
//     id:'p1',
//     title: 'Taj Mahal',
//     description: 'One of the Top 10 Wonders in the World!',
//     imageUrl:'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Taj_Mahal_Front.JPG/800px-Taj_Mahal_Front.JPG?20120915083330',
//     address:'Dharmapuri, Forest Colony, Tajganj, Agra, Uttar Pradesh 282001',
//     location:{
//         lat: 27.173891,
//         lng: 78.042068
//     },
//     creator: 'u1'
//     }
// ];


const getPlaceById = async (req, res, next) => {
    const placeId = req.params.pid;
    let place;
    try{
        place = await Place.findById(placeId); 
    }
    catch(err){
        const error = new HttpError('Something went wrong. Could not find a place', 500);
        return next(error);
    }
    if(!place){ 
        const error =  new HttpError('Could not find a place for the provided ID.', 404);
        return next(error);
    }
        console.log('GET Request in Places');
        res.json({place: place.toObject({ getters:true }) });  // Javascript automatically shortens this line { place } => { place: place }
                                                                              
    
};

//Alternatives for Arrow Function above


// function getPlaceById() {......}
// const getPlaceById = function() {....}


const getPlacesByUserId = async (req, res, next) => {
    const userId = req.params.uid;
    // let places;
    let userWithPlaces;
    try{
        userWithPlaces = await User.findById(userId).populate('places');
    }
    catch(err){
        const error = new HttpError('Fetching Places Failed. Please try again later', 500);
        return next(error);
    }
    //if(!places || places.length === 0){}
    if(!userWithPlaces || userWithPlaces.places.length === 0){
        return next(new HttpError('Could not find places for the provided USER ID.', 404)); 
        }
    res.json({places: userWithPlaces.places.map(place => place.toObject({getters: true}))});
    // we can't use toObject() directly to an array therefore we use .map()- standard JS method.
};

// module.exports is used only if single middleware is used. Here we use two so node has other syntax to export multiple ones.

const createPlace = async(req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
       return next( new HttpError('Invalid Inputs. Please check your data', 422));
    }
    const {title, description,address} = req.body;
    let coordinates;
    try{
        coordinates = await getCoordsForAddress(address);
    }catch(error){
       return next(error);
    }
    //This is changed for Database Connection
    // const createdPlace = {
    //     id:uuidv4() ,
    //     title,
    //     description,
    //     location: coordinates,
    //     address,
    //     creator
    // };
    // DUMMY_PLACES.push(createdPlace); //push() will add the element in the last of the array and UNSHIFT() adds the element to the first.
    const createdPlace = new Place({
        title,
        description,
        address,
        location:coordinates,
        //image: 'https://images.hindustantimes.com/img/2021/12/28/550x309/RBI_1627088344086_1640732416356.jpg',
        image: req.file.path, // here the file is not stored only the path is stored bcoz rendering takes time when we store it in DB so we store it locally
        creator: req.userData.userId
    });

    //while establishing the connection we need to check whether the Creator ID already exists so we use try catch again
    let user;
    try{
        user = await User.findById(req.userData.userId);
    }
    catch(err){
        const error = new HttpError('Creating place failed, please try again later',500);
        return next(error);
    }


    if(!user){
        const error = new HttpError('We could not find the user for the provided ID', 404);
        return next(error);
    }

    console.log(user);

    try{
        // await createdPlace.save();   // Save() is a Mongoose Function which is used just like push() in Node JS
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await createdPlace.save({session:sess});
        //placeID is also be added to our user
        user.places.push(createdPlace);  // push() here is not a regular javascript function it's an mongoose function
        await user.save({session: sess});
        await sess.commitTransaction();
    }
    catch(err){
        const error =  new HttpError('Creating place failed. Please try again', 500);
        return next(error);   // To stop the code execution if error occurs if we don't add this the execution will continue.
    };
    
    res.status(201).json({place: createdPlace});
}; 
// The above statement is Object Destructuring in Javascript. to get all the values under one object it is very simple.
//eg: const title = req.body;
//    const description = req.body; Instead of doing like this we do this.

const updatePlace = async(req,res,next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return next(new HttpError('Invalid Inputs. Please check your data', 422));  
    }
    const {title, description} = req.body;
    const placeId = req.params.pid;

    // const updatedPlace = DUMMY_PLACES.find(p => p.id === placeId) shortform of arrow function
    // here we use spread operator to copy all by wrap the entire thing in in an object so that all the key, value pairs of the old object.

    // const updatedPlace = {... DUMMY_PLACES.find(p => p.id === placeId)};
    // const placeIndex = DUMMY_PLACES.findIndex(p => p.id === placeId); // This returns the index of the place in the array.

    let place;
    try{
        place = await Place.findById(placeId);
    }
    catch(err){
        const error = new HttpError('Something went wrong. Could not update place', 500);
        return next(error);
    }

    if(place.creator.toString() !== req.userData.userId){
        const error = new HttpError('You are not allowed to Edit this place', 401);
        return next(error);
    }
    // updatedPlace.title = title;
    // updatedPlace.description = description; // To Understand these you must know about Primitives and  Reference Values
    place.title = title;
    place.description = description; 

    // To store the updated data in the database
    try{
        await place.save();
    }
    catch(err){
        const error = new HttpError('Something went wrong. Could not update place', 500);
        return next(error);
    }
    //DUMMY_PLACES[placeIndex] = updatedPlace;
    res.status(200).json({place: place.toObject({getters: true})});

};


const deletePlace = async(req,res,next) => {
    const placeId = req.params.pid;
    // if(!DUMMY_PLACES.find(p => p.id === placeId)){
    //     throw new HttpError('Could not find a place for that Id.', 404);
    // }
    // DUMMY_PLACES = DUMMY_PLACES.filter(p => p.id !== placeId);   // If the id doesn't match it will return the place if it matches it will delete and move to status response.
    // This filter method is a JS method and it returns new array based on the filter we pass through the function

    let place;
    try{
        // place = await Place.findById(placeId);
        place = await Place.findById(placeId).populate('creator'); // populate is used to look into the users database and find a particular place
        //(means which user holds this place) This method is subject to the ref which we used in user.js and place.js schemas.
    }
    catch(err){
        const error = new HttpError('Something went wrong. Could not delete place', 500);
        return next(error);
    }

    //To check whether the place Exists;
    if(!place){
        const error = new HttpError('Could not find a place for this Id.', 404);
        return next(error);
    }

    if(place.creator.id !== req.userData.userId){
        const error = new HttpError('You are not allowed to delete this place', 401);
        return next(error);
    }

    // To delete the place and update the deletion in the database.

    const imagePath = place.image;
    try{
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await place.remove({session: sess});
        place.creator.places.pull(place); // To access place stored in the creator // pull() will automatically remove the id
        await place.creator.save({session: sess});
        await sess.commitTransaction();
    }
    catch(err){
        const error = new HttpError('Something went wrong. Could not delete place', 500);
        return next(error);
    }

    fs.unlink(imagePath, err => {
        console.log(err);
    });
    res.status(200).json({message: 'Place has been deleted!'});
};


exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;