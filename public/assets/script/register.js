const registerForm = document.querySelector(".register-form");

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

registerForm.addEventListener("submit", event => {
    event.preventDefault();
    const firstname = event.target.firstname.value;
    const lastname = event.target.lastname.value;
    const email = event.target.email.value;
    const password = event.target.password.value;
    const registerType = event.target['register-type'].value;

    const messageHolder = document.querySelector(".form-message");
    messageHolder.style.color = "red";

    const body = {
        firstname,
        lastname,
        email,
        password
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