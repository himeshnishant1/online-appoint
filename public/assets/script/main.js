function logout(event){
    event.preventDefault();
    fetch("/logout", {
            method: "get"
        })
        .then(response => response.json())
        .then(response => {
            if(response.status === "ok"){
                document.querySelector(".container").innerHTML = `<h2 style="color:green;">${response.message}</h2>`;
                setTimeout(() => {
                    window.location.href = "/";
                }, 2000);
            }
        })
        .catch(err => {
            document.querySelector(".container").innerHTML = `<h2 style="color:red;">${err}</h2>`;
        });
}