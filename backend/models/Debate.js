const mongoose=require('mongoose')

const messageSchema = new mongoose.Schema({
    sender: {
        type: String,
        enum: ['user', 'ai'],
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    timestamp : {type: Date, default : Date.now},
})

const debateSchema = new mongoose.Schema({
    topic : {type : String, required : true},
    userStance : String,
    messages : [messageSchema],
    feedback : String,
    user:{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        //required: false,
    },
    createdAt : {type : Date, default : Date.now},
})

module.exports = mongoose.model("Debate", debateSchema)