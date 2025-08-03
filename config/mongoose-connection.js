const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/Bagistry", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(function(){
    console.log("Database connected");
}).catch(function(err){
    console.log(err);
});


module.exports = mongoose.connection;