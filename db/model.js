const mongoose = require('mongoose');
const groups = new mongoose.Schema({
    groupName : {
        type : String,
        required : true
    },
    groupId : {
        type : String,
        required : true,
        unique : true
    }
});

module.exports = mongoose.model("groups", groups);

