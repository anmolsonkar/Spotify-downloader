let html = document.querySelector("html");
let select = document.querySelector(".theme");
const input = document.getElementById("search")
let micbutton = document.querySelector(".mic");
const display = document.querySelector(".display");

const socket = io('https://spotify-downloader.koyeb.app/')

let currentSearch;
let screen = window.innerWidth;

input.addEventListener("input", () => {
    const query = input.value.trim();
    handleQuery(query);
});

function micData(voice) {
    input.value = voice;
    const query = input.value.trim();
    handleQuery(query);
}

function handleQuery(query) {
    currentSearch = query;
    if (query !== "") {
        socket.emit("send", query, screen);
    } else {
        display.innerHTML = "";
        display.style.display = "none";
        input.style.border = "1px solid #e1e2e4";
        input.style.borderRadius = "60px";
    }
}


socket.on("receive", (results) => {

    if (currentSearch === '') {

        return;
    }

    document.addEventListener("click", (event) => {

        if (event.target === input && results && event.target.value) {

            display.style.display = "grid";
            input.style.borderBottomRightRadius = "0px";
            input.style.borderBottomLeftRadius = "0px";
        }

        else {
            display.style.display = "none";
            input.style.borderRadius = "30px";
        }

    });

    display.innerHTML = "";
    display.style.display = "grid";
    input.style.borderRadius = "30px";
    input.style.borderBottomRightRadius = "0px";
    input.style.borderBottomLeftRadius = "0px";

    const list = [];

    results.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = ` <p><img src="${item.image}" loading="lazy" >${item.name} by ${item.artists}</p>`;
        li.querySelector('p').addEventListener('click', () => {
            iframe.src = `https://open.spotify.com/embed/track/${item.id}?utm_source=generator&theme=0`;
            document.querySelector(".footer").style.backgroundColor = "#282828";
            socket.emit("select", item);
            micOff();
        })
        list.push(li)
    });

    display.append(...list);

});


socket.on("select", data => {
    btn.data = data;
    if (btn.data) {
        btn.style.display = "flex"

    }
})


const btn = document.getElementById("Download") || createDownloadButton();
btn.style.display = "none"

function createDownloadButton() {
    const btn = document.createElement("button");
    btn.id = "Download";
    btn.textContent = "Download";
    btn.style.backgroundColor = "#1ED760"
    document.body.appendChild(btn);
    return btn;
}

btn.addEventListener("click", () => {

    socket.emit("download", btn.data);
    socket.on("loading", data => {
        btn.textContent = data.response;
        btn.disabled = true
        btn.style.backgroundColor = "grey"
    })
});

socket.on('buffer', (result) => {
    const audioBlob = new Blob([result.blob]);
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.all.name}-${result.all.artists}.mp3`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
    console.log("end")
    btn.textContent = "Download";
    btn.disabled = false
    btn.style.backgroundColor = "#1ED760";

});


document.addEventListener("DOMContentLoaded", () => {

    const storedTheme = localStorage.getItem("theme");
    html.style.backgroundColor = storedTheme === "dark" ? "#282828" : "white";
    select.src = storedTheme === "dark" ? "img/sun.png" : "img/moon.png";

    select.addEventListener("click", toggleTheme);

    function toggleTheme() {
        if (html.style.backgroundColor === "white") {
            html.style.backgroundColor = "#282828";
            select.src = "img/sun.png";
            localStorage.setItem("theme", "dark");
        } else {
            html.style.backgroundColor = "white";
            select.src = "img/moon.png";
            localStorage.setItem("theme", "light");
        }
    }
})

micbutton.addEventListener("click", micaction);
let micImg = micbutton;
micImg = "img/mic-off.png";

function micaction() {
    if (micImg === "img/mic-off.png") {
        micOn();
    } else {
        micOff();
    }
    micbutton.src = micImg;
}

let recognition;
let recognitionTimeout;

function startSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
        if (!recognition) {
            recognition = new webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;

            recognition.onstart = () => {
                startRecognitionTimer();
            };

            recognition.onresult = async (event) => {
                const result = event.results[event.results.length - 1];
                const transcript = result[0].transcript;
                micData(transcript)
                resetRecognitionTimer(); // Reset the timer on speech input
            };

            recognition.onaudioend = () => {
                // The user stopped speaking, so start the 5-second timer
                startRecognitionTimer();
            };

            recognition.onend = () => {
                clearRecognitionTimer();
            };
        }

        recognition.start();

        input.addEventListener('input', () => {
            resetRecognitionTimer(); // Reset the timer on user input
            micOff();
        });
    } else {
        alert('Web Speech API is not supported in this browser.');
    }
}

function startRecognitionTimer() {
    recognitionTimeout = setTimeout(() => {
        micOff();
    }, 5000);
}

function resetRecognitionTimer() {
    clearTimeout(recognitionTimeout);
    startRecognitionTimer();
}

function clearRecognitionTimer() {
    clearTimeout(recognitionTimeout);
}

function stopSpeechRecognition() {
    if (recognition) {
        recognition.stop();
        micbutton.src = "img/mic-off.png";
        input.setAttribute("placeholder", "What do you want to listen to?");
    }
}

function micOn() {
    micImg = "img/mic-on.png";
    input.setAttribute("placeholder", "Listening...");
    startSpeechRecognition();
}

function micOff() {
    micImg = "img/mic-off.png";
    input.setAttribute("placeholder", "What do you want to listen to?");
    stopSpeechRecognition();
}