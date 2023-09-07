loginForm = document.querySelector(".login-form");

loginForm.addEventListener("submit", event => {
    event.preventDefault();
    const email = event.target.email.value;
    const password = event.target.password.value;
    const loginType = event.target['login-type'].value;

    const messageHolder = document.querySelector(".form-message");
    messageHolder.style.color = "red";

    const body = {
        email,
        password
    };

    fetch(`/login/${loginType}`, {
            method: "post",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        })
        .then(response => response.json())
        .then(response => {
            if(response.status === "failed")    messageHolder.innerHTML = response.message;
            else if(response.status === "ok"){
                messageHolder.style.color = "green";
                messageHolder.innerHTML = "Login Completed!!";
                setTimeout(() => {
                    window.location.href = "/";
                }, 1000);
            }
        })
        .catch(error => {
            messageHolder.innerHTML = error;
        });
});