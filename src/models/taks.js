import mongoose from "mongoose"




const taskSchema = mongoose.Schema({
    description : {
        type : String,
        trim : true,
        required : true
    },
    status : {
        type : Boolean,
        default : false
    },
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        required : true,
        ref: 'User'
    }
},{
    timestamps:true
})


const Task = mongoose.model('Task',taskSchema)

export default Task