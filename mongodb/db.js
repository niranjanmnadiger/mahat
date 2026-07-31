const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = mongoose.ObjectId;



const User = new Schema({ //Schema defines the shape -- user is a schema of user collection , like a blue print

    email: String, // loose schemas
    //email : {type: String, unique: true}; ----> strict schema - this makes sures no double entry is possible in the feild of email
    password: String,
    name: String
});

const Todo = new Schema({

    title: String,
    done: Boolean,
    userId: ObjectId
});

// model is the tool used to communicate with mongodb collection
//so here user model for user collection and todo model for todo collection
// Without the model, the schema only describes the structure—it cannot itself query or modify MongoDB.

const UserModel = mongoose.model('users', User);
const TodoModel = mongoose.model('todos', Todo)

//exporting them - as this can later be imported inside index.js for further use 
module.exports = {
    UserModel: UserModel,
    TodoModel: TodoModel
}