const mongoose = require('mongoose');
const connectDB = async (url)=>{
    const conn = await mongoose.connect(url, {
        useUnifiedTopology : true,
        useNewUrlParser : true,
        
    })
}

module.exports = connectDB