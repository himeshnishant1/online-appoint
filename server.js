const express = require("express");
const db = require("./database/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const fs = require("fs");

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.use(cookieParser());

const home = fs.readFileSync(__dirname + "/view/home.html", "utf-8");
const user_home = fs.readFileSync(__dirname + "/view/user_home.html", "utf-8");
const consultant_home = fs.readFileSync(__dirname + "/view/consultant_home.html", "utf-8");
const get_started_home = fs.readFileSync(__dirname + "/view/get_started_home.html", "utf-8");
const profile = fs.readFileSync(__dirname + "/view/profile.html", "utf-8");
const consultant_profile = fs.readFileSync(__dirname + "/view/consultant_profile.html", "utf-8");

app.get("/", (req, res) => {
    if(req.cookies.token){
        const verify = jwt.verify(req.cookies.token, "shhh");

        const navContent = `<li><a href="/">Home</a></li>
                            <li><a href="/profile">${verify.name}</a></li>
                            <li onclick="logout(event)"><a href="#">Logout</a></li>`;
        
        let newHome = home.replace("{%RenderNavContent%}", navContent);

        if(verify.login_type === "u"){
            // newHome = newHome.replace("{%RenderContent%}", user_home);
            newHome = newHome.replace("{%RenderContent%}", `<div style="display='block';"><h1>${verify.name}</h1><br><h3>${verify.email}</h3><br><h4>${(verify.login_type === "u")? "user": "Consultant"}</h4></div>`);
        }
        if(verify.login_type === "c"){
            // newHome = newHome.replace("{%RenderContent%}", consultant_home);
            newHome = newHome.replace("{%RenderContent%}", `<div style="display='block';"><h1>${verify.name}</h1><br><h3>${verify.email}</h3><br><h4>${(verify.login_type === "u")? "user": "Consultant"}</h4></div>`);
        }

        newHome = newHome.replace("{%RenderId%}", verify.id);

        res.status(200).send(newHome);
    }
    else{
        let newHome = home.replace("{%RenderContent%}", get_started_home);

        const navContent = `<li><a href="/">Home</a></li>
                            <li><a href="/login.html">Login</a></li>
                            <li><a href="/register.html">Register</a></li>`;

        newHome = newHome.replace("{%RenderNavContent%}", navContent);
        newHome = newHome.replace("{%RenderId%}", "");
        res.status(200).send(newHome);
    }
});

app.post("/register/:type", async (req, res) => {
    const {firstname, lastname, email, password} = req.body;
    const registerType = req.params.type;
    
    let tableName = "users";
    if(registerType == "u") tableName = "users";
    if(registerType == "c") tableName = "consultants"

    if(!(firstname && lastname && email && password))   res.status(400).json({status: "failed", message: "All Fields are medatory!!"});

    db.query(`SELECT * from ${tableName} WHERE email = ?`, [email], async (err, result, fields) => {
        if(err) res.status(500).json({status: "failed", message: `${err}`}); 
        else if(result.length > 0)    res.status(500).json({status: "failed", message: "User Already Registered!!"});
        else{
            const hashPassword = await bcrypt.hash(password, 10);

            db.query(`INSERT INTO ${tableName} (id, firstname, lastname, email, password) VALUES (NULL, ?, ?, ?, ?)`, [firstname, lastname, email, `${hashPassword}`], (e, r, f) => {
                if(e) res.status(500).json({status: "failed", message: `${e}`}); 
                else    res.status(200).json({status: "ok", data: r});
            });
        }
    });
});

app.post("/login/:type", async (req, res) => {
    //console.log(req.body);
    const {email, password} = req.body;
    const loginType = req.params.type;
    
    let tableName = "users";
    if(loginType == "u") tableName = "users";
    if(loginType == "c") tableName = "consultants"

    if(!(email && password))   res.status(400).json({status: "failed", message: "All Fields are medatory!!"});

    db.query(`SELECT * from ${tableName} WHERE email = ?`, [email], async (err, result, fields) => {
        if(err) res.status(500).json({status: "failed", message: `${err}`}); 
        else if(result.length == 0)  res.status(500).json({status: "failed", message: "User not found!!"}); 
        else{
            if(!bcrypt.compare(password, result[0].password)){
                res.status(500).json({status: "failed", message: `Wrong Credentials!!`}); 
            }
            else{
                const token = jwt.sign(
                    {
                        id: result[0].id,
                        email,
                        name: result[0].firstname + " " + result[0].lastname,
                        login_type: loginType
                    },
                    "shhh",
                    {
                        expiresIn: "2h"
                    }
                );
                result[0].password = undefined;
                const user = {...result[0], token};

                const options = {
                    expires: new Date(Date.now() + 2 * 60 * 60 * 1000),
                    httpOnly: true
                };

                res.status(200).cookie("token", token, options).json({
                    status: "ok",
                    data: user
                });

            }
        }
    });
});

app.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.status(200).json({
        status: "ok",
        message: "User Logout Succcessful!!"
    });
});

app.get("/profile", (req, res) => {
    try{
        if(req.cookies.token){
            const verify = jwt.verify(req.cookies.token, "shhh");
            const profileType = verify.login_type;
            const email = verify.email;

            let tableName = "users";
            if(profileType === "u") tableName = "users";
            if(profileType === "c") tableName = "consultants"

            if(profileType === 'c'){
                db.query(`SELECT * FROM ${tableName} WHERE email=?`, [email], (err, result) => {
                    if(err){
                        res.status(500).send(`<h3>${err}</h3>`);
                    }
                    else if(result.length === 0){
                        res.status(500).send(`<h3>User Not Found!!</h3>`);
                    }
                    else{
                        const data = result[0];
        
                        let newProfile = profile.replace("{%RenderPersonName%}", `${data.firstname + " " + data.lastname}`);
        
                        const navContent = `<li><a href="/">Home</a></li>
                                            <li><a href="/profile">${verify.name}</a></li>
                                            <li onclick="logout(event)"><a href="#">Logout</a></li>`;
                        newProfile = newProfile.replace("{%RenderNavContent%}", navContent);
                        if(profileType === "u") newProfile = newProfile.replace("{%RenderContent%}", `<h1>${verify.name} is SignedIn</h1>`);
                        
                        //Started
                        const curYear= new Date(Date.now()).getFullYear();
                        const curDate= new Date(Date.now()).getDate();
                        const curMonth= new Date(Date.now()).getMonth();

                        const firstDayOfMonth = new Date(curYear, curMonth, 1).getDay();
                        const lastDayOfMonth = new Date(curYear, curMonth + 1, 0).getDay();
                        const lastDateOfMonth = new Date(curYear, curMonth + 1, 0).getDate();

                        const months = ["January", "February", "March", "April","May","June","July", "August", "September", "October", "November", "December"];

                        let newConsultantProfile = consultant_profile;
                        let availabilityStatus = data.availability_status;

                        if(availabilityStatus)  availabilityStatus = JSON.parse(availabilityStatus);

                        const setCalendar = () => {
                            // if(availabilityStatus)  console.log(availabilityStatus);
                            newConsultantProfile = newConsultantProfile.replace("{%RenderCurrentMonth%}", months[curMonth]);

                            if(!availabilityStatus || availabilityStatus.month !== months[curMonth]){
                                let newJsonObject = {
                                    month: `${months[curMonth]}`,
                                    times: [],
                                    dates: {}
                                };

                                availabilityStatus = newJsonObject;

                                db.query(`UPDATE consultants SET availability_status=? WHERE id=${data.id}`, [JSON.stringify(newJsonObject)], (error) => {
                                    if(error)   res.status(500).send(`<h3>${error}</h3>`);
                                });
                            }

                            // console.log(availabilityStatus)

                            let listDays = "";
                            let lastDateOfLastMonth;

                            if(curMonth === 0){
                                lastDateOfLastMonth = new Date(curYear - 1, 12, 0).getDate();
                            }
                            else{
                                lastDateOfLastMonth = new Date(curYear, curMonth, 0).getDate();
                            }

                            for(let i = firstDayOfMonth * 1; i > 0; i--){
                                listDays +=  `<li class="inactive" style="cursor:not-allowed">${lastDateOfLastMonth * 1 - i + 1}</li>\n`; 
                            }

                            for(let i = 1; i <= lastDateOfMonth * 1; i++){
                                if(availabilityStatus){
                                    const className = availabilityStatus.dates[`${i}`] ? "selected-date": "";
                                    if(i == curDate)    listDays += `<li class="${className}" style="border:1px solid rgb(219, 102, 243);color:rgb(219, 102, 243);" onclick="clickableDate(event)">${i}</li>\n`;
                                    else    listDays += `<li class="${className}" onclick="clickableDate(event)">${i}</li>\n`; 
                                }
                                else{
                                    if(i == curDate)    listDays += `<li style="border:1px solid rgb(219, 102, 243);color:rgb(219, 102, 243);" onclick="clickableDate(event)">${i}</li>\n`;
                                    else    listDays += `<li onclick="clickableDate(event)">${i}</li>\n`; 
                                }
                            }

                            for(let i = lastDayOfMonth; i < 6; i++){
                                listDays += `<li class="inactive">${i - parseInt(lastDayOfMonth) + 1}</li>\n`; 
                            }

                            newConsultantProfile = newConsultantProfile.replace("{%RenderCurrentMonthDays%}", listDays);
                        };

                        setCalendar();
                        

                        const setWorkTime = () => {
                            if(availabilityStatus){
                                newConsultantProfile = newConsultantProfile.replace("{%RenderStartTime%}", availabilityStatus.times[0]);
                                newConsultantProfile = newConsultantProfile.replace("{%RenderLunchStartTime%}", availabilityStatus.times[1]);
                                newConsultantProfile = newConsultantProfile.replace("{%RenderLunchEndTime%}", availabilityStatus.times[2]);
                                newConsultantProfile = newConsultantProfile.replace("{%RenderEndTime%}", availabilityStatus.times[3]);
                            }
                            else{
                                newConsultantProfile = newConsultantProfile.replace("{%RenderStartTime%}", "");
                                newConsultantProfile = newConsultantProfile.replace("{%RenderLunchStartTime%}", "");
                                newConsultantProfile = newConsultantProfile.replace("{%RenderLunchEndTime%}", "");
                                newConsultantProfile = newConsultantProfile.replace("{%RenderEndTime%}", "");
                            }
                        };

                        setWorkTime();

                        //Ended

                        if(profileType === "c") newProfile = newProfile.replace("{%RenderContent%}", newConsultantProfile);

                        res.status(200).send(newProfile);
                    }
                });
            }
        }
        else{
            res.status(404).send("<h1>Page Not Found</h1>");
        }
    }
    catch(err){
        res.status(500).send(`${err}`);
    }
});

app.patch("/update/:updateType", (req, res) => {
    const updateType = req.params.updateType;

    if(req.cookies.token){
        const verify = jwt.verify(req.cookies.token, "shhh");
        
        const email = verify.email;
        const profileType = verify.login_type;
        
        let tableName = "users";
        if(profileType === "u") tableName = "users";
        if(profileType === "c") tableName = "consultants"
        
        if(profileType === "c"){
            db.query(`SELECT * FROM ${tableName} WHERE email=?`, [email], (err, result) => {
                if(err)   res.status(500).json({status: "failed", message: `${err}`});
                else{
                    if(updateType === "times"){
                        let availabilityStatus = JSON.parse(result[0].availability_status);
                        const times = req.body.times;
                        availabilityStatus.times = times;
                        db.query(`UPDATE consultants SET availability_status=? WHERE id=?`, [JSON.stringify(availabilityStatus), result[0].id], (error) => {
                            if(error)   res.status(500).json({status: "failed", message: `${error}`});
                            else{
                                res.status(200).json({status: "ok", message: `Working Hours were updated!!`});
                            }
                        });
                    }
                    else if(updateType === "dates"){
                        if(result[0].availability_status.times.length === 0) res.status(500).json({status: "failed", message: `Choose The Working Hours First!!`});
                        else{
                            let availabilityStatus = JSON.parse(result[0].availability_status);
                            const dates = req.body.dates;
                            const times = 
                            availabilityStatus.dates = {...availabilityStatus.dates, dates}
                        }
                    }
                    else{
                        res.status(500).json({status: "failed", message: `Not Suitable Update`});
                    }
                }
            });
        }//TODO
        else{
            res.status(500).json({status: "failed", message: `TODO`});
        }
    }
    else{
        res.status(500).json({status: "failed", message: `No Loging Data Found...`});
    }
});

const port = 8070;
app.listen(port, () => {
    console.log("server is listening to 127.0.0.1:" + port);
});