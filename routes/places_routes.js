const express = require('express');
const { check } = require('express-validator');
const placesControllers = require('../Controllers/places_controllers.js');
const fileUpload = require('../middleware/file-upload.js');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();
//This is different Router not like app.js

router.get('/:pid', placesControllers.getPlaceById);


//to add the dynamic value of the user id we create an other middleware

router.get('/user/:uid',placesControllers.getPlacesByUserId);

// We are using a middleware exactly before the 3 routers as it travels from top to 
//bottom approach and check if we have a valid token only the router will get access.

router.use(checkAuth);

// we can create multiple middlewares under one method like below
router.post('/',
fileUpload.single('image'),
[
    check('title').not().isEmpty(),
    check('description').isLength({min:5}),
    check('address').not().isEmpty()
],
(placesControllers.createPlace));

router.patch('/:pid',
[
    check('title').not().isEmpty(),
    check('description').isLength({min:5})
], (placesControllers.updatePlace) );

router.delete('/:pid',placesControllers.deletePlace );

module.exports = router;