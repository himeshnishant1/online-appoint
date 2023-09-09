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
                    message.innerText = "Something wrong happened. Please try again later.";
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