const mongoose = require('mongoose')
const {isEmail} = require('validator')
const bcrypt = require('bcrypt')



const userSchema = new mongoose.Schema({
    email:{
        type:String,
        required:[true,'please enter an email'],
        unique:true,
        lowercase:true,
        validate:[isEmail,'Please enter a valid email']
    },
    password:{
        type:String,
        required:[true,'please enter a password'],
        minLength: [6,'Minimum password length is 6 characters']
    },
    firstName:{type:String},
    lastName: {type:String},
    companyName: {type:String},
    street: {type:String},
    zipCode: {type:String},
    city: {type:String},
    vat:{type:String},
    admin: {
        type: Boolean,
        default: false, 
      }
         
})





userSchema.post('save',function(doc,next){
   next()
})


userSchema.pre('save', async function(next){
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password,salt)

    console.log('user about to be created & saved ',this)
    next()
})

userSchema.statics.login = async function(email,password){
    const user = await this.findOne({email:email})
    if (user) {
       const auth = await bcrypt.compare(password,user.password)
        if (auth) {
            return user
        }
        throw Error('incorrect password')
    } 
    throw Error('incorrect email')
}

  
userSchema.statics.loginReset = async function(email){
    const user = await this.findOne({email:email})
    if (user) {
        return user
        }
     
    throw Error('incorrect email')
}



const User = mongoose.model('user', userSchema);

module.exports = User