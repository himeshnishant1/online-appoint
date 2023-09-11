const express = require("express");
const db = require("./database/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const nodemailer = require("nodemailer");

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
const get_appointment = fs.readFileSync(__dirname + "/view/get_appointment.html", "utf-8");
const error_page = fs.readFileSync(__dirname + "/view/error_page.html", "utf-8");

app.get("/", async (req, res) => {
    try{
        if(req.cookies.token){
            const curYear= new Date(Date.now()).getFullYear();
            const curDate= new Date(Date.now()).getDate();
            const curMonth= new Date(Date.now()).getMonth();

            const firstDayOfMonth = new Date(curYear, curMonth, 1).getDay();
            const lastDayOfMonth = new Date(curYear, curMonth + 1, 0).getDay();
            const lastDateOfMonth = new Date(curYear, curMonth + 1, 0).getDate();

            const months = ["January", "February", "March", "April","May","June","July", "August", "September", "October", "November", "December"];


            const verify = jwt.verify(req.cookies.token, "shhh");

            const navContent = `<li><a href="/">Home</a></li>
                                <li><a href="/profile">${verify.name}</a></li>
                                <li onclick="logout(event)"><a href="#">Logout</a></li>`;
            
            let newHome = home.replace("{%RenderNavContent%}", navContent);

            if(verify.login_type === "u"){
                let newUser = user_home;
                db.query(`SELECT * FROM Users WHERE email=?`, [verify.email], async (err, result) => {
                    if(err) res.status(500).send(`${err}`);
                    else{
                        let appointments = result[0].appointments;
                        if(appointments){
                            appointments = JSON.parse(appointments);
                            if(Object.keys(appointments.dates).length > 0)  newUser += `<div class="meeting-cards">`;
                            const months = ["January", "February", "March", "April","May","June","July", "August", "September", "October", "November", "December"];
                            
                            Object.keys(appointments.dates).forEach(async (day) => {
                                Object.keys(appointments.dates[`${day}`]).forEach(async (timeSlot) => {
                                    let startingTime = timeSlot.substring(0, timeSlot.indexOf("-") - 1);
                                    startingTime = (startingTime.substring(0, 2) * 60) + (startingTime.substring(4));
                                    if((day === curDate &&  startingTime > (new Date(Date.now()).getHours() * 60 + new Date(Date.now()).getMinutes() * 1)) || (day > curDate)){
                                        newUser += `<div class="card" data-id="">
                                                        <div class="card-body">
                                                            <h5 class="card-title"><b style="font-size: large;">Date:</b> ${day + " " + months[curMonth]}</h5>
                                                            <h5 class="card-title"><b style="font-size: large;">Time Slot:</b> ${timeSlot}</h5>
                                                            <h5 class="card-title"><b style="font-size: large;">Consultant:</b> ${[appointments.dates[`${day}`][`${timeSlot}`]]}</h5>
                                                            <p class="card-text"><b style="font-size: large;">Agenda:</b> General Purpose.</p>
                                                        </div>
                                                    </div>`;
                                    }
                                });
                            });

                            if(Object.keys(appointments.dates).length > 0)  newUser += `</div>`; 
                        }
                        newHome = newHome.replace("{%RenderContent%}", newUser);
                        newHome = newHome.replace("{%RenderId%}", verify.id);
                        res.status(200).send(newHome);
                    }
                });
            }
            else if(verify.login_type === "c"){
                let newConsultant = consultant_home;
                db.query(`SELECT * FROM Consultants WHERE email=?`, [verify.email], async (err, result) => {
                    if(err) res.status(500).send(`${err}`);
                    else{
                        let availabilityStatus = result[0].availability_status;
                        if(availabilityStatus){
                            availabilityStatus = JSON.parse(availabilityStatus);
                            newConsultant += `<div class="meeting-cards">`;
                            const months = ["January", "February", "March", "April","May","June","July", "August", "September", "October", "November", "December"];
                            Object.keys(availabilityStatus.dates).forEach(async (day) => {
                                Object.keys(availabilityStatus.dates[`${day}`]).forEach(async (timeSlot) => {
                                    let startingTime = timeSlot.substring(0, timeSlot.indexOf("-") - 1);
                                    startingTime = (startingTime.substring(0, 2) * 60) + (startingTime.substring(4));
                                    if((day === curDate &&  startingTime > (new Date(Date.now()).getHours() * 60 + new Date(Date.now()).getMinutes() * 1)) || (day > curDate)){
                                        newConsultant += `<div class="card" data-id="">
                                                        <div class="card-body">
                                                            <h5 class="card-title"><b style="font-size: large;">Date:</b> ${day + " " + months[curMonth]}</h5>
                                                            <h5 class="card-title"><b style="font-size: large;">Time Slot:</b> ${timeSlot}</h5>
                                                            <h5 class="card-title"><b style="font-size: large;">Consultant:</b> ${[availabilityStatus.dates[`${day}`][`${timeSlot}`]]}</h5>
                                                            <p class="card-text"><b style="font-size: large;">Agenda:</b> General Purpose.</p>
                                                        </div>
                                                    </div>`;
                                    }
                                });
                            });
                            newConsultant += `</div>`; 
                        }
                        newHome = newHome.replace("{%RenderContent%}", newConsultant);
                        newHome = newHome.replace("{%RenderId%}", verify.id);
                        res.status(200).send(newHome);
                    }
                });
            }
            else{
                //TODO
                newHome = newHome.replace("{%RenderId%}", verify.id);
                res.status(200).send("Work Under Progress");
            }
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
    }
    catch(err){
        let errorPage = error_page.replace("{%RenderError%}", `${err}`);
        res.status(500).send(errorPage);
    }
});

app.post("/register/:type", async (req, res) => {
    try{
        const {firstname, lastname, email, password, otp} = req.body;
        if(!req.cookies.ovtfp || jwt.verify(req.cookies.ovtfp, "shhh").otp != otp){
            res.status(500).json({status: "failed", message: `Invalid OTP!!`}); 
        }
        else{
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
                        else{
                            res.status(200).json({status: "ok", data: r});
                            res.clearCookie("ovtfp");
                        }
                    });
                }
            });
        }
    }
    catch(err){
        res.status(500).json({status: "failed", message: `${err}`}); 
    }
});

app.post("/OTP/get", async (req, res) => {
    try{
        const email = req.body.email;
        const transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
                user: 'enrique96@ethereal.email',
                pass: 'nyn3C3gYCvEFnZe2T2'
            },
        });
        

        async function main() {
            const generatedOtp = Math.floor(1000 + Math.random() * 9000);
            const emailFormat = {
                from: '"Get Appointments" <enrique96@ethereal.email>',
                to: `${email}`,
                subject: "Verification through OTP",
                text: `OTP: ${generatedOtp}`
            };
            const info = await transporter.sendMail(emailFormat);
            const ovtfp = jwt.sign({"otp": `${generatedOtp}`}, "shhh",{expiresIn:"1m"});
            res.status(200).cookie("ovtfp", ovtfp, {expires: new Date(Date.now() + 2 * 60 * 60 * 1000),httpOnly: true}).json({status: "ok", message: "OTP Sent!!"});
        }
        
        main().catch(err => {
            res.status(500).json({status: "failed", message: `${err}`});
        });
    }
    catch(err){
        res.status(500).json({status: "failed", message: `${err}`});
    }
});

app.post("/login/:type", async (req, res) => {
    try{
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
    }
    catch(err){
        res.status(500).json({status: "failed", message: `${err}`}); 
    }
});

app.get("/logout", (req, res) => {
    try{
        res.clearCookie("token");
        res.status(200).json({
            status: "ok",
            message: "User Logout Succcessful!!"
        });
    }
    catch(err){
        res.status(500).json({
            status: "failed",
            message: `${err}`
        });
    }
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
                                if(i < curDate){
                                    listDays +=  `<li class="inactive" style="cursor:not-allowed">${i}</li>\n`; 
                                }
                                else{
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
    try{
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
                            const dates = req.body.dates;
                            let availabilityStatus = JSON.parse(result[0].availability_status);
                            if(availabilityStatus.times.length === 0) res.status(500).json({status: "failed", message: `Choose The Working Hours First!!`});
                            else if(availabilityStatus.dates[`${dates}`] && Object.keys( availabilityStatus.dates[`${dates}`] ).length > 0) res.status(500).json({status: "failed", message: `Can not remove date because a meeting is already scheduled!!`});
                            else{
                                if(availabilityStatus.dates[`${dates}`])    delete availabilityStatus.dates[`${dates}`];    
                                else  availabilityStatus.dates[`${dates}`] = {};
                                db.query(`UPDATE consultants SET availability_status=? WHERE id=?`, [JSON.stringify(availabilityStatus), result[0].id], (error) => {
                                    if(error)   res.status(500).json({status: "failed", message: `${error}`});
                                    else{
                                        res.status(200).json({status: "ok", message: `Dates updated!!`});
                                    }
                                });
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
    }
    catch(err){
        res.status(500).json({status: "failed", message: `${err}`});
    }
});

app.get("/getToken", (req, res) => {
    try{
        if(req.cookies.token){
            const verify = jwt.verify(req.cookies.token, "shhh");
            const email = verify.email;

            db.query(`SELECT * from Consultants WHERE email=?`, [email], (error, result) =>{
                if(error) res.status(500).json({status: "failed", message: `${error}`});
                else{
                    const availabilityStatus = JSON.parse(result[0].availability_status);
                    if(!availabilityStatus || !availabilityStatus.times)  res.status(500).json({status: "failed", message: `Please Set the Working Hours First...`});
                    else{
                        const token = jwt.sign({email: email}, "shhh", {expiresIn: "48h"});
                        res.status(200).json({status: "ok", token: `${token}`});
                    }
                }
            });
        }
        else{
            res.status(500).json({status: "failed", message: "Can not find login details..."});
        }
    }
    catch(err){
        res.status(500).json({status: "failed", message: `${err}`});
    }
});

app.get("/bookAppointment/getCalendar/:token", (req, res) => {
    try{
        if(req.cookies.token){ 
            const verify = jwt.verify(req.cookies.token, "shhh");
            const userEmail = verify.email;

            const token = jwt.verify(req.params.token, "shhh");

            if(!token.email)   throw new Error("Invalid Token Found");
            const consultantEmail = token.email;

            db.query(`SELECT * FROM Consultants WHERE email=?`, [consultantEmail], (err, result) => {
                if(err){
                    let errorPage = error_page.replace("{%RenderError%}", `${err}`);
                    res.status(500).send(errorPage);
                }
                else if(result.length === 0){
                    let errorPage = error_page.replace("{%RenderError%}", `<h3>User Not Found!!</h3>`);
                    res.status(500).send(errorPage);
                }
                else{
                    const data = result[0];
                    
                    const curYear= new Date(Date.now()).getFullYear();
                    const curDate= new Date(Date.now()).getDate();
                    const curMonth= new Date(Date.now()).getMonth();

                    const firstDayOfMonth = new Date(curYear, curMonth, 1).getDay();
                    const lastDayOfMonth = new Date(curYear, curMonth + 1, 0).getDay();
                    const lastDateOfMonth = new Date(curYear, curMonth + 1, 0).getDate();

                    const months = ["January", "February", "March", "April","May","June","July", "August", "September", "October", "November", "December"];

                    let newAppointment = get_appointment;
                    let availabilityStatus = data.availability_status;

                    if(availabilityStatus)  availabilityStatus = JSON.parse(availabilityStatus);

                    const setCalendar = () => {
                        newAppointment = newAppointment.replace("{%RenderCurrentMonth%}", months[curMonth]);

                        if(!availabilityStatus || availabilityStatus.month !== months[curMonth]){
                            let newJsonObject = {
                                month: `${months[curMonth]}`,
                                dates: {}
                            };

                            availabilityStatus = newJsonObject;

                            db.query(`UPDATE consultants SET availability_status=? WHERE id=${data.id}`, [JSON.stringify(newJsonObject)], (error) => {
                                if(error){
                                    let errorPage = error_page.replace("{%RenderError%}", `${error}`);
                                    res.status(500).send(errorPage);
                                }
                            });
                        }

                        let listDays = "";
                        let lastDateOfLastMonth;

                        if(curMonth === 0)  lastDateOfLastMonth = new Date(curYear - 1, 12, 0).getDate();
                        else    lastDateOfLastMonth = new Date(curYear, curMonth, 0).getDate();

                        for(let i = firstDayOfMonth * 1; i > 0; i--){
                            listDays +=  `<li class="inactive" style="cursor:not-allowed">${lastDateOfLastMonth * 1 - i + 1}</li>\n`; 
                        }

                        for(let i = 1; i <= lastDateOfMonth * 1; i++){
                            if(i < curDate){
                                listDays +=  `<li class="inactive" style="cursor:not-allowed">${i}</li>\n`; 
                            }
                            else{
                                if(availabilityStatus.dates[`${i}`]){
                                    if(i == curDate)    listDays += `<li class="selected-date" style="border:1px solid rgb(219, 102, 243);color:rgb(219, 102, 243);" onclick="ChooseDate(event)">${i}</li>\n`;
                                    else    listDays += `<li class="selected-date" onclick="ChooseDate(event)">${i}</li>\n`; 
                                }
                                else{
                                    if(i == curDate)    listDays += `<li style="border:1px solid rgb(219, 102, 243);color:rgb(219, 102, 243);">${i}</li>\n`;
                                    else    listDays += `<li>${i}</li>\n`; 
                                }
                            }
                        }

                        for(let i = lastDayOfMonth; i < 6; i++){
                            listDays += `<li class="inactive">${i - parseInt(lastDayOfMonth) + 1}</li>\n`; 
                        }

                        newAppointment = newAppointment.replace("{%RenderCurrentMonthDays%}", listDays);
                    };

                    setCalendar();

                    const options = {
                        expires: new Date(Date.now() + 20 * 60 * 1000),
                        httpOnly: true
                    };

                    res.status(200).cookie("appt", req.params.token, options).send(newAppointment);
                }
            });
            
        }
        else{
            res.status(500).send(`
                                    <h3>User Must Login First!!</h3></br>
                                    <a href="/login.html">login</a></br>
                                    <a href="/register.html">Register</a>
                                `);
        }
    }
    catch(err){
        let errorPage = error_page.replace("{%RenderError%}", `${err}`);
        res.status(500).send(errorPage);
    }
});

app.get("/bookAppointment/getTimeSlots/:day", (req, res) => {
    try{
        const day = req.params.day;
        if(!req.cookies.token)  throw new Error("Login Credentials not found...");
        const token = jwt.verify(req.cookies.token, "shhh");    
        if(!req.cookies.appt)   throw new Error("Something went wrong...");
        const appointment_token = jwt.verify(req.cookies.appt, "shhh");
        
        db.query(`SELECT * FROM Consultants WHERE email=?`,[appointment_token.email], (err, result) => {
            if(err) throw new Error(`${err}`);
            else{
                const cdata = result[0];
                let availabilityStatus = cdata.availability_status;
                if(availabilityStatus){
                    availabilityStatus = JSON.parse(availabilityStatus);
                    if(availabilityStatus.dates[`${day}`]){
                        const times = availabilityStatus.times;
                        let sTime = times[0];
                        sTime = (sTime.substring(0, 2) * 60) + (sTime.substring(3, 5) * 1);
                        let lunchSTime = times[1];
                        lunchSTime = (lunchSTime.substring(0, 2) * 60) + (lunchSTime.substring(3, 5) * 1);
                        let lunchETime = times[2];
                        lunchETime = (lunchETime.substring(0, 2) * 60) + (lunchETime.substring(3, 5) * 1);
                        let eTime = times[3];
                        eTime = (eTime.substring(0, 2) * 60) + (eTime.substring(3, 5) * 1);
                        
                        const getTimeInString = (time) => {
                            let hours = parseInt(time / 60) + "";
                            if(hours.length === 1)  hours = "0" + hours;
                            let minutes = parseInt(time % 60) + "";
                            if(minutes.length === 1)  minutes = "0" + minutes;
                            return hours + ":" + minutes;
                        };

                        let slots = [];
                        let i = sTime;
                        while(i + 30 <= lunchSTime){
                            if((new Date(Date.now()).getDate() == day)){
                               if(i >= (new Date(Date.now()).getHours() * 60 + new Date(Date.now()).getMinutes() * 1) + 60){
                                    const slotTime = getTimeInString(i) + " - " + getTimeInString(i + 30);
                                    const slot = `<div onclick="bookAppointmentWithDayAndTimeSlot(event)">${slotTime}</div>`;
                                    if(!availabilityStatus.dates[`${day}`][`${slotTime}`])  slots.push(slot);
                               } 
                            }
                            else if((new Date(Date.now()).getDate() < day)){
                                const slotTime = getTimeInString(i) + " - " + getTimeInString(i + 30);
                                const slot = `<div onclick="bookAppointmentWithDayAndTimeSlot(event)">${slotTime}</div>`;
                                if(!availabilityStatus.dates[`${day}`][`${slotTime}`])  slots.push(slot);
                            }
                            i += 30;
                        }

                        i = lunchETime;
                        while(i + 30 <= eTime){
                            if((new Date(Date.now()).getDate() == day)){
                                if(i >= (new Date(Date.now()).getHours() * 60 + new Date(Date.now()).getMinutes() * 1) + 60){
                                    const slotTime = getTimeInString(i) + " - " + getTimeInString(i + 30);
                                    const slot = `<div onclick="bookAppointmentWithDayAndTimeSlot(event)">${slotTime}</div>`;
                                    if(!availabilityStatus.dates[`${day}`][`${slotTime}`]) slots.push(slot);
                                } 
                            }
                            else if((new Date(Date.now()).getDate() < day)){
                                const slotTime = getTimeInString(i) + " - " + getTimeInString(i + 30);
                                const slot = `<div onclick="bookAppointmentWithDayAndTimeSlot(event)">${slotTime}</div>`;
                                if(!availabilityStatus.dates[`${day}`][`${slotTime}`]) slots.push(slot);
                            }
                            i += 30;
                        }

                        res.status(200).send({status: "ok",slots});
                    }
                    else    throw new Error("Something went wrong...");
                }
                else    throw new Error("Something went wrong...");
            }
        });
    }
    catch(err){
        let errorPage = error_page.replace("{%RenderError%}", `${err}`);
        res.status(500).send(errorPage);
    }
});

app.get("/bookAppointment/:day/:timeSlot", (req, res) => {
    try{
            const day = req.params.day;
        const timeSlot = req.params.timeSlot;
        if(!req.cookies.token)  throw new Error("Login Credentials not found...");
        const token = jwt.verify(req.cookies.token, "shhh");    
        if(!req.cookies.appt)   throw new Error("Something went wrong...");
        const appointment_token = jwt.verify(req.cookies.appt, "shhh");
        
        db.query(`SELECT * FROM Consultants WHERE email=?`,[appointment_token.email], (err, result) => {
            if(err) res.status(500).json({status: "failed", message: `${error}`});
            else{
                const cdata = result[0];
                let availabilityStatus = JSON.parse(cdata.availability_status);
                if(!availabilityStatus.dates[`${day}`][`${timeSlot}`]){

                    const times = availabilityStatus.times;
                    let sTime = times[0];
                    sTime = (sTime.substring(0, 2) * 60) + (sTime.substring(3, 5) * 1);
                    let lunchSTime = times[1];
                    lunchSTime = (lunchSTime.substring(0, 2) * 60) + (lunchSTime.substring(3, 5) * 1);
                    let lunchETime = times[2];
                    lunchETime = (lunchETime.substring(0, 2) * 60) + (lunchETime.substring(3, 5) * 1);
                    let eTime = times[3];
                    eTime = (eTime.substring(0, 2) * 60) + (eTime.substring(3, 5) * 1);

                    const timeArray = timeSlot.split("-");
                    timeArray[0] = timeArray[0].trim();
                    timeArray[1] = timeArray[1].trim();
                    const ltl = (timeArray[0].substring(0, 2) * 60) + (timeArray[0].substring(3, 5) * 1);
                    const utl = (timeArray[1].substring(0, 2) * 60) + (timeArray[1].substring(3, 5) * 1);

                    if((ltl >= sTime && utl <= lunchSTime) || (ltl >= lunchETime && utl <= eTime)){
                        db.query(`SELECT * FROM Users WHERE email=?`, [token.email], (error, result) => {
                            if(error)   res.status(500).json({status: "failed", message: `${error}`});
                            else{
                                let udata = JSON.parse(result[0].appointments);
                                const curMonth= new Date(Date.now()).getMonth();
                                const months = ["January", "February", "March", "April","May","June","July", "August", "September", "October", "November", "December"];
                                if(udata === null || udata.month !== months[curMonth]){
                                    udata = {month: months[curMonth], dates: {}};
                                    db.query(`UPDATE Users SET appointments=? WHERE id=?`, [JSON.stringify(udata), token.id], (error) => {
                                        if(error)  res.status(500).json({status: "failed", message: `${error}`});
                                    });
                                }
                                if(udata.dates[`${day}`]){
                                    if(udata.dates[`${day}`][`${timeSlot}`]){
                                        res.status(500).json({status: "failed", message: "You Already has an Appointment with in Time Slot please choose another time slot!!"});
                                        return;
                                    }
                                    else{
                                        udata.dates[`${day}`][`${timeSlot}`] = `${cdata.email}`;
                                    }
                                }
                                else{
                                    const dates = JSON.parse(`{"${timeSlot}" : "${cdata.email}"}`);
                                    udata.dates[`${day}`] = dates;
                                }
                                db.query(`UPDATE Users SET appointments=? WHERE id=?`, [JSON.stringify(udata), token.id], (error) => {
                                    if(error)   res.status(500).json({status: "failed", message: `${error}`});
                                    else{
                                        availabilityStatus.dates[`${day}`][`${timeSlot}`] = token.email;
                                        db.query(`UPDATE Consultants SET availability_status=? WHERE email=?`, [JSON.stringify(availabilityStatus), appointment_token.email], (error) => {
                                            if(error)   res.status(500).json({status: "failed", message: `${error}`});
                                            else{
                                                res.status(200).json({status: "ok", message: `<h3>Appointment Booking Success on ${day} ${months[curMonth]} time Slot: ${timeSlot}</h3>`});
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                    else    res.status(500).json({status: "failed", message: "Time Slot not available!!"});

                }
                else    res.status(500).json({status: "failed", message: "Time Slot not available!!"});
            }
        });
    }
    catch(err){
        res.status(500).json({status: "failed", message: `${err}`});
    }
});

const port = 8070;
const startServer = () => {
    try {
        app.listen(port, () => {
            console.log("server is listening to 127.0.0.1:" + port);
        });
    } catch (error) {
        console.log(error);
    }
}

startServer();