try{
    const getTokenButton = document.querySelector(".get-token-btn");
    const message = document.querySelector(".message");
    const getTokenUrl = document.querySelector(".getTokenUrl");
    const getTokenOnly = document.querySelector(".getTokenOnly");
    const url = document.querySelector(".url");
    const tokenOnly = document.querySelector(".token-only");

    message.style.display = "none";
    url.style.display = "none";
    tokenOnly.style.display = "none";

    getTokenButton.addEventListener('click', event => {
        event.preventDefault();
        message.style.display = "none";
        url.style.display = "none";
        tokenOnly.style.display = "none";
        fetch("/getToken", {
                method: "get"
            })
            .then(response => response.json())
            .then(response => {
                if(response.status === "ok"){
                    url.style.display = "flex";
                    getTokenUrl.value = `127.0.0.1:8070/bookAppointment/${response.token}`;
                    tokenOnly.style.display = "flex";
                    getTokenOnly.value = `${response.token}`;
                    message.style.display = "block";
                    message.style.color = "green";
                    message.innerText = "Token Generated and will be active till 48 hours. Please Copy the below Url or Token Only Token.";
                }
                else{
                    message.style.display = "block";
                    message.style.color = "red";
                    message.innerText = response.message;
                }
            })
            .catch(err => {
                message.style.display = "block";
                message.style.color = "red";
                message.innerText = `${err}`;
            });
    });
}
catch(err){
    console.log(err);
}

try{
    const message = document.querySelector(".message");
    const getAppointmentButton = document.querySelector(".get-appointment-btn");
    const pastedToken = document.querySelector(".pastedToken"); 

    message.style.display = "none";

    getAppointmentButton.addEventListener("click", event => {
        event.preventDefault();
        console.log("Here");
        message.style.display = "none";
        window.location.href = `/bookAppointment/getCalendar/${pastedToken.value.trim()}`;
    });
}
catch(err){
    console.log(err);
}

let chooseDay;
let chooseTimeSlot;

function ChooseDate(event){
    event.preventDefault();
    chooseDay = event.target.innerHTML;
    const day = event.target.innerHTML;
    fetch(`/bookAppointment/getTimeSlots/${day}`, {
            method: "get"
        })
        .then(response => response.json())
        .then(response => {
            if(response.status === "ok"){
                const slots = response.slots;
                const chooseDate = document.querySelector(".choose-time");
                chooseDate.innerHTML = "";
                slots.forEach(slot => chooseDate.innerHTML += slot);
                document.querySelector(".calendar").style.display = "none";
                document.querySelector(".back-button").style.display = "block";
                chooseDate.style.display = "flex";
                document.querySelector(".container h2").innerHTML = "Choose a Time Slot";
            }
        })
        .catch(err => {
            console.log(err);
        });
}

function showCalendar(event){
    event.preventDefault();
    document.querySelector(".choose-time").innerHTML = "";
    document.querySelector(".back-button").style.display = "none";
    document.querySelector(".container h2").innerHTML = "Choose a Day";
    document.querySelector(".calendar").style.display = "block";
    document.querySelector(".choose-time").style.display = "none";
}

function bookAppointmentWithDayAndTimeSlot(event){
    event.preventDefault();
    chooseTimeSlot = event.target.innerHTML;
    fetch(`/bookAppointment/${chooseDay}/${chooseTimeSlot}`, {
            method: "GET"
        })
        .then(response => response.json())
        .then(response => {
            if(response.status === "ok"){
                alert(response.message);
                window.location.href = "/"
            }
            else if(response.status === "failed"){
                alert(response.message);
            }
        })
        .catch(err => {
            console.log(err);
        });
}