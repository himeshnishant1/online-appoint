function clickableDate(event){
    event.preventDefault();
    if(event.target.classList.contains("selected-date")){
        event.target.classList.remove("selected-date");
    }
    else{
        const body = {
            dates: event.target.innerHTML
        }
        fetch("/update/dates", {
                method: "PATCH",
                headers:{
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            })
            .then(response => response.json())
            .then(response => {
                if(response.status === "ok")    event.target.classList.add("selected-date");
                else    console.log(response.message);
            })
            .catch(err => {
                console.log(err);
            });
    }
}

const editUpdateButton = document.querySelector(".edit-working-hours");

function editUpdateTiming(event){
    event.preventDefault();
    const currentStatus = event.target.innerHTML;
    const timeInputs = document.querySelectorAll(".container .working-time div input");

    const startingTime = document.querySelector(".starting-time");
    const lunchStartingTime = document.querySelector(".lunch-starting-time");
    const lunchEndingTime = document.querySelector(".lunch-ending-time");
    const EndingTime = document.querySelector(".ending-time");

    if(currentStatus === "Edit"){
        timeInputs.forEach(timeInput => timeInput.disabled = false);
        event.target.innerHTML = "Update";

        startingTime.addEventListener("input", event => {
            if(lunchStartingTime.value.length > 0){
                let sTime = startingTime.value;
                let lunchSTime = lunchStartingTime.value;
                sTime = (sTime.substring(0, 2) * 60) + (sTime.substring(3, 5) * 1);
                lunchSTime = (lunchSTime.substring(0, 2) * 60) + (lunchSTime.substring(3, 5) * 1);
                if(sTime >= lunchSTime){
                    alert("Start Time Should be less than Lunch Start Timming!!");
                    startingTime.value = "";
                }
            }
        });

        lunchStartingTime.addEventListener("input", event => {
            if(startingTime.value === ""){
                alert("Please Input a Starting Hour first!!");
                lunchStartingTime.value = "";
            }
            else{
                let sTime = startingTime.value;
                let lunchSTime = lunchStartingTime.value;
                sTime = (sTime.substring(0, 2) * 60) + (sTime.substring(3, 5) * 1);
                lunchSTime = (lunchSTime.substring(0, 2) * 60) + (lunchSTime.substring(3, 5) * 1);
                if(sTime >= lunchSTime){
                    alert("Lunch Start Timming Should be greater than Start Time!!");
                    lunchStartingTime.value = "";
                }
            }

            if(lunchEndingTime.value.length > 0){
                let lunchETime = lunchEndingTime.value;
                let lunchSTime = lunchStartingTime.value;
                lunchETime = (lunchETime.substring(0, 2) * 60) + (lunchETime.substring(3, 5) * 1);
                lunchSTime = (lunchSTime.substring(0, 2) * 60) + (lunchSTime.substring(3, 5) * 1);
                if(lunchSTime >= lunchETime){
                    alert("Lunch End Time Should be greater than Lunch Start Time!!");
                    lunchStartingTime.value = "";
                }
            }
        });

        lunchEndingTime.addEventListener("input", event => {
            if(lunchStartingTime.value === ""){
                alert("Please Input a Lunch Start Time first!!");
                lunchEndingTime.value = "";
            }
            else{
                let lunchETime = lunchEndingTime.value;
                let lunchSTime = lunchStartingTime.value;
                lunchETime = (lunchETime.substring(0, 2) * 60) + (lunchETime.substring(3, 5) * 1);
                lunchSTime = (lunchSTime.substring(0, 2) * 60) + (lunchSTime.substring(3, 5) * 1);
                if(lunchSTime >= lunchETime){
                    alert("Lunch End Time Should be greater than Lunch Start Time!!");
                    lunchEndingTime.value = "";
                }
            }

            if(EndingTime.value.length > 0){
                let eTime = EndingTime.value;
                let lunchETime = lunchEndingTime.value;
                eTime = (eTime.substring(0, 2) * 60) + (eTime.substring(3, 5) * 1);
                lunchETime = (lunchETime.substring(0, 2) * 60) + (lunchETime.substring(3, 5) * 1);
                if(eTime <= lunchETime){
                    alert("Lunch End Time Should be less than Ending Time!!");
                    lunchEndingTime.value = "";
                }
            }
        });

        EndingTime.addEventListener("input", event => {
            if(lunchEndingTime.value === ""){
                alert("Please Input a Lunch Ending Time first!!");
                EndingTime.value = "";
            }
            else{
                let eTime = EndingTime.value;
                let lunchETime = lunchEndingTime.value;
                eTime = (eTime.substring(0, 2) * 60) + (eTime.substring(3, 5) * 1);
                lunchETime = (lunchETime.substring(0, 2) * 60) + (lunchETime.substring(3, 5) * 1);
                if(eTime <= lunchETime){
                    alert("Ending Time Should be greater than Lunch End Time!!");
                    EndingTime.value = "";
                }
            }
        });
    }else if(currentStatus === "Update"){
        let sTime = startingTime.value;
        let lunchSTime = lunchStartingTime.value;
        let lunchETime = lunchEndingTime.value;
        let eTime = EndingTime.value;

        if(!(sTime.length === 5 && lunchSTime.length === 5 && lunchETime.length === 5 && eTime.length === 5)){
            alert("All Times are Mendatory");
        }
        else{

            const body = {
                times: [`${sTime}`, `${lunchETime}`, `${lunchETime}`, `${eTime}`]
            };

            // times Update Api Request.
            fetch("/update/times", {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(body)
                })
                .then(response => response.json())
                .then(response => {
                    if(response.status === "ok"){
                        timeInputs.forEach(timeInput => timeInput.disabled = true);
                        event.target.innerHTML = "Edit";
                        window.location.reload();
                    }
                    else{
                        alert(`${response.message}`);
                    }
                })
                .catch(err => {
                    alert(`${err}`);
                });
        }
    }
}