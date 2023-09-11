const registerForm = document.querySelector(".register-form");
const getOtpButton = document.querySelector(".getOtp");
const OtpMessage = document.querySelector(".otp-message");
const registerButton = document.querySelector(".register-btn");
const otpInput = document.querySelector(".otp-input");


const getType = sessionStorage.getItem('rt');

if(getType){
    if(getType === 'u'){
        const userButton = document.querySelector("#user");
        userButton.checked = "true";
    }
    if(getType === 'c'){
        const consultantButton = document.querySelector("#consultant");
        consultantButton.checked = "true";
    }
}

//TODO
getOtpButton.addEventListener("click", event => {
    event.preventDefault();
    const email = document.querySelector("#email").value;
    fetch('/OTP/get', {
            method: "post",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({email})
        })
        .then(res => res.json())
        .then(async (res) => {
            if(res.status === "ok"){
                getOtpButton.disabled = true;
                OtpMessage.style.display = "block";
                OtpMessage.style.color = "green";
                OtpMessage.innerHTML = "OTP Sent!!"

                const otpCheckGroup = document.querySelector(".otp-check-group");
                otpCheckGroup.style.display = "flex";

                let i = 30;
                const start_counter = setInterval(() => {
                    getOtpButton.innerHTML = `Resend in ${i}s`;
                    i--;
                }, 1000);

                setTimeout(() => {
                    clearInterval(start_counter);
                    OtpMessage.style.display = "none";
                    getOtpButton.disabled = false;
                    getOtpButton.innerHTML = "Resend";
                }, 1000 * 30);
            }
            else{
                OtpMessage.style.display = "block";
                OtpMessage.style.color = "red";
                OtpMessage.innerHTML = `${res.message}`;
            }
        })
        .catch(err => {
            alert(err);
        });

});

registerForm.addEventListener("submit", event => {
    event.preventDefault();
    const firstname = event.target.firstname.value;
    const lastname = event.target.lastname.value;
    const email = event.target.email.value;
    const otpInput = event.target.otpInput.value;
    const password = event.target.password.value;
    const registerType = event.target['register-type'].value;

    const messageHolder = document.querySelector(".form-message");
    messageHolder.style.color = "red";

    const body = {
        firstname,
        lastname,
        email,
        password,
        otp: `${otpInput}`
    };

    fetch(`/register/${registerType}`, {
            method: "post",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        })
        .then(response => response.json())
        .then(response => {
            console.log(response);
            if(response.status === "failed")    messageHolder.innerHTML = response.message;
            else if(response.status === "ok"){
                messageHolder.style.color = "green";
                messageHolder.innerHTML = "Registeration Completed!!";
                setTimeout(() => {
                    window.location.href = "/login.html";
                }, 1000);
            }
        })
        .catch(error => {
            messageHolder.innerHTML = error;
        });
});