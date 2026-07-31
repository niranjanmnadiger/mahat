const express = require("express");
const app = express();
const { UserModel, TodoModel } = require("./db");
const jwt = require("jsonwebtoken"); //jwt for signin process and auth process of user 
const { default: mongoose } = require("mongoose");
const JWT_SECRET = "niri@123"

//this is how we conncect to db - with admin and password 
mongoose.connect("mongodb+srv://admin:12345@cluster0.tjb34dm.mongodb.net/todo-app-database");

app.use(express.json());


//endpoints

app.post("/signup", async function (req, res) { //whenever we use await - that should be a async fn. dont forget

    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;

    await UserModel.create({    // if u dont await - how will we know if the thing is logged in DB or not, what if the db is not connected
        email: email,
        password: password,
        name: name
    }) // this is for one user at a time - for multiple user we have to change this so it accepts array of objects

    res.json({
        message: "you are logged in"
    })

});


app.post("/signin", async function (req, res) {

    const email = req.body.email;
    const password = req.body.password;

    const user = await UserModel.findOne({ // findone finds that one document with email and matching password from the collecton
        email: email,
        password: password

    })

    console.log(user);

    if (user) {

        const token = jwt.sign({
            id: user._id.toString()
        }, JWT_SECRET);
        res.json({
            token: token
        })

    } else {
        res.status(403).json({
            message: "inncorrect credentials"
        })
    }


});

app.post("/todo", auth, function (req, res) {
    const userId = req.userId;
    const todos = req.body.title;

    TodoModel.create({ //this creates a new document inside todo collection 

        title,
        userId
    })


    res.json({
        userId: userId
    })
});

app.get("/todo", auth, async function (req, res) {
    const userId = req.userId;

    const todos = await TodoModel.find({ //find the userid 
        userId: userId
    })

    res.json({
        userId: userId
    })
});



function auth(req, res, next) { //authentication fucntion --> middleware
    const token = req.headers.token;

    const decodedData = jwt.verify(token, JWT_SECRET);

    if (decodedData) {
        req.userId = decodedData.id;
        next();
    } else {
        res.status(403).json({
            message: "incorrect creds"
        })
    }
}
app.listen(3000);