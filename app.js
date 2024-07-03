const express = require('express');
const session = require('express-session');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const app = express();

app.use(session({
    secret: 'some secret',
    cookie: { maxAge: 1800000},
    saveUninitialized: false,
    resave: true
}));

//set as ejs view engine
app.set("views", __dirname + '/views');
app.set('view engine', 'ejs'); 

//serve static files
app.use(express.static("views", {"extensions": ["html","htm"]}));
app.use(express.static("public", {"extensions": ["css", "js"]}));
app.use(express.static("Photos", {"extensions": ["jpeg", "png"]}));

//middleware to parse requestsbody
app.use(bodyParser.urlencoded({ extended: true }));


//server viewing port number 
app.listen(8000, (err) =>{
    if (err) throw err;
    console.log("listening on port 8000");
});

//function to create a mysql connection
function getConnection() {
    var con = mysql.createConnection({
        host: "localhost",
        user: "aaron",
        password: "password",
        database: "fitnesstracker"
    });
    return con;
}

//render the login page
app.get("/", (req, res) =>{
    res.render("login")
});


//handles the user login
app.post("/loginuser", (req, res) => {
    var login = [req.body.username, req.body.password];

    var myConnection = getConnection();
    myConnection.connect((err) => {
        if (err) throw err;
        console.log("connection to the database is established");

        const sql = "SELECT * FROM person WHERE username = ? AND password = ?";
        myConnection.query(sql, login, (err, results, fields) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ message: 'Internal server error' });
            }

            if (results.length === 1) {
                req.session.user = results[0];
                res.redirect("/dashboard");
            } else {
                res.status(401).json({ message: 'Invalid credentials' });
            }
        });
    });
});

app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session: ", err);
            res.status(500).send("Error logging out. Please try again.");
        } else {
            res.send("/login");
        }
    });
})

//renders the dashboard

app.get("/dashboard", (req, res) =>{
    if(req.session.user){
        res.render('dashboard', {user: req.session.user});
    }
    else{
        res.redirect("/login");
    }
});

app.get("/viewprofile", (req, res) =>{
    if(req.session.user){
        res.render('userprofile', {user: req.session.user});
    }
    else{
        res.redirect("/login");
    }
});

app.get("/workout",(req, res)=>{
    if(req.session.user){
        res.render('workout', {user: req.session.user}); 
        console.log(req.session.user.Id);
    }
    else{
        res.redirect("/login");
    }
});

app.get("/history", (req, res) => {
    if (req.session.user) {
        res.render('history', { user: req.session.user });
        console.log(req.session.user.Id);
    } 
    else {
        res.redirect("/login");
    }
});


app.post("/register", (req, res) =>{
    var regData = [req.body.firstName, req.body.lastName, req.body.email, req.body.phonenumber, req.body.city, req.body.username, req.body.password];

    var myConnection = getConnection();
    myConnection.connect((err) =>{
        if (err) throw err;
        console.log("database connection")
        var sql = "INSERT INTO `person`(`Id`, `firstName`, `lastName`, `email`, `phonenumber`, `city`, `username`, `password`) VALUES (0,?, ?,?,?,?,?,?)";
        myConnection.query(sql, regData, (err, result, fields) =>{
            if (err) throw err;
            console.log("result: " + JSON.stringify(result));
            if (result.affectedRows > 0){
                res.render("login")
            } else{
                res.send("registeration failed")
            }
            myConnection.end((err) =>{
                if (err) throw err;
            })
        });
    });
});

app.get("/registerpage", (req, res) =>{
    res.render("register")
});

app.get("/loginpage", (req, res) =>{
    res.render("login")
})

// Handle workout insertion
app.post("/workoutinsert", (req, res) => {
    if (req.session.user) {
        const workoutdata = [req.session.user.Id, req.body.excer, req.body.reps, req.body.sets];
        const myConnection = getConnection();
        myConnection.connect((err) => {
            if (err) throw err;
            console.log("Database connection");

            const sql = "INSERT INTO `workouts`(`workout_Id`, `id`, `excer`, `reps`, `sets`, `date`) VALUES (0, ?, ?, ?, ?, NOW())";
            myConnection.query(sql, workoutdata, (err, result) => {
                if (err) {
                    console.error("Error executing query:", err.message);
                    res.send("Insert failed");
                } else {
                    if (result.affectedRows > 0) {
                        res.render("workout", { message: "Workout logged successfully!", user: req.session.user });
                    } else {
                        res.send("Insert failed");
                    }
                }
                myConnection.end();
            });
        });
    } else {
        res.redirect("/login");
    }
});


app.get("/userdata",(req, res) => {
    var myConnection = getConnection();
    myConnection.connect((err) => {
        if (err) throw err;
        myConnection.query("SELECT * FROM workouts ORDER BY Date DESC LIMIT 1;", (err, result, fields)=>{
            if (err) throw err;
            console.log(result);
            console.log(fields);
            myConnection.end((err)=>{
                if (err) console.error("Error closing connection: " + err.message);
                res.render("userdata", {"result" : result, "fields": fields});
            });
        });
    });
});