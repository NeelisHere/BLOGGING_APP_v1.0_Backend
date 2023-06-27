const mongoose = require('mongoose')


const PostSchema = new mongoose.Schema({

    title:{
        type: 'string',
        required: true
    },
    summary:{
        type: 'string',
        required: true
    },
    content:{
        type: 'string',
        required: true
    },
    cover: {
        type: 'string'
    },
    author:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User'
    }

},{timestamps: true}
)

const PostModel = new mongoose.model('Post', PostSchema)

module.exports = PostModel

