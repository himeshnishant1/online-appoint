const {createConnection} = require("mysql");

const db = createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "appointment_app"
});

db.connect((err) => {
    if(err) console.log(err);
    else    console.log("Connected to MYSQL...");
});

module.exports = db;