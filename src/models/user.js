
import mongoose from "mongoose"
import validator from 'validator'
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Task from "./taks.js"

//methods đối với document, còn statics là với collection


const userSchema = mongoose.Schema({
    name:{
        type:String,
        trim : true,
        required: true
    },
    email : {
        type :String,
        required : true,
        unique : true,
        trim:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email is invalid')
            }
        }
    },
    password:{
        type:String,
        required : true,
        trim:true,
        minlength:7,
        validate(value){
            if(validator.contains(value.toLowerCase(),'password')){
                throw new Error('no contain password')
            }
        }

    },
    age:{
        type:Number,
        default : 0,
        validate(value){
            if(value<0){
                throw new Error('age must be a positive number')
            }
        }
    },
    tokens:[
        {
            token : {
                type : String,
                required : true
            }
        }
    ] ,
    avatar : {
        type:Buffer
    }
},{
    timestamps:true
})

//set mối quan hệ 1-n, còn 1-1 là cái ref bên model task qua bển mà coi
userSchema.virtual('tasks',{
    ref: 'Task',
    localField : '_id',
    foreignField : 'owner'
})

userSchema.methods.generateAuthToken = async function () {
    
    const user = this 
    const token = jwt.sign({_id:user._id.toString()},process.env.JWT_SECRET,{expiresIn : '7 days'})

    user.tokens = user.tokens.concat({token})

    await user.save()

    return token
}


userSchema.statics.findByCredentials = async (email,password) => {
    const user = await User.findOne({email})

    if(!user){
        throw new Error('Unable to login')
    }

    const isMatch = bcryptjs.compare(password,user.password)

    if(!isMatch){
        throw new Error('Unable to login')
    }

    return user
}

//methods đối với document, còn statics là với collection
userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens

    return userObject
}


//middleware hash password
userSchema.pre('save',async function (next) {
    
    const user = this

    if(user.isModified('password')){
        user.password = await bcryptjs.hash(user.password,8)
    }

    console.log('pre saving')

    next()
})

userSchema.pre('remove',async function (next) {

    const user = this

    await Task.deleteMany({owner:user._id})

    next()
    
})

const User = mongoose.model('User',userSchema)

export default User