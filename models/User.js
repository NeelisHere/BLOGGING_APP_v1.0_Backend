const mongoose = require('mongoose')


const UserSchema = new mongoose.Schema({
    username:{
        type: 'string',
        required: true,
        minLength: 4,
        unique: true
    },
    email:{
        type: 'string',
        required: true,
        unique: true
    },
    password:{
        type: 'string',
        required: true
    }
})

const UserModel = new mongoose.model('User', UserSchema)

module.exports = UserModel

