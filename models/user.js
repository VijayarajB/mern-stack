const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const uniqueValidator = require('mongoose-unique-validator');

const userSchema = new Schema ({
    name:{type:String, required: true},
    email:{type:String, required: true, unique: true},   
    // unique does not validates it just only creates an internal index
    //in the database to make it easier and faster to query our emails
    password:{type:String, required: true, minlength: 6},
    image:{type:String, required: true},
    // As one user can have multiple places we add this places in an array.
    places:[{type:mongoose.Types.ObjectId, required: true, ref: 'Place'}]
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User',userSchema);