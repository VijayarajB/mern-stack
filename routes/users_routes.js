const express = require('express');
const usersControllers = require('../Controllers/users_controllers');
const fileUpload = require('../middleware/file-upload');
const {check} = require('express-validator');


const router = express.Router();

router.get('/', usersControllers.getUsers);

router.post('/signup', 
fileUpload.single('image'),
[
    check('name').not().isEmpty(),
    check('email').normalizeEmail().isEmail(), //normalizeEmail does this Test@test.com => test@test.com
    check('password').isLength({min:6})
], 
usersControllers.signup);

router.post('/login', usersControllers.login);

module.exports = router;