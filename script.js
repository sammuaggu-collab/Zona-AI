document.addEventListener("DOMContentLoaded", function () {

    /* =========================
       ELEMENTS
    ========================= */

    const sidebar =
        document.getElementById("sidebar");

    const backdrop =
        document.getElementById("sidebarBackdrop");

    const menuButton =
        document.getElementById("menuButton");

    const closeButton =
        document.getElementById("closeSidebar");

    const newChatButton =
        document.getElementById("newChatButton");

    const chatArea =
        document.getElementById("chatArea");

    const chatHistory =
        document.getElementById("chatHistory");

    const messageInput =
        document.getElementById("messageInput");

    const sendButton =
        document.getElementById("sendButton");

    const attachButton =
        document.getElementById("attachButton");

    const fileInput =
        document.getElementById("fileInput");

    const attachmentPreview =
        document.getElementById("attachmentPreview");

    const voiceButton =
        document.getElementById("voiceButton");


    /* =========================
       STATE
    ========================= */

    let chats = [];

    let currentChat = null;

    let waitingForAI = false;

    let selectedFiles = [];

    let recognition = null;


    /* =========================
       SIDEBAR
    ========================= */

    function openSidebar() {

        sidebar.classList.add("open");

        backdrop.classList.add("show");
    }


    function closeSidebar() {

        sidebar.classList.remove("open");

        backdrop.classList.remove("show");
    }


    menuButton.addEventListener(
        "click",
        openSidebar
    );


    closeButton.addEventListener(
        "click",
        closeSidebar
    );


    backdrop.addEventListener(
        "click",
        closeSidebar
    );


    /* =========================
       CREATE CHAT
    ========================= */

    function createChat() {

        const chat = {

            id: Date.now(),

            title: "New Chat",

            messages: []

        };


        chats.unshift(chat);

        currentChat = chat;

        selectedFiles = [];


        saveChats();

        renderAttachments();

        showChat();

        updateHistory();

        closeSidebar();

        messageInput.focus();
    }


    newChatButton.addEventListener(
        "click",
        createChat
    );


    /* =========================
       ATTACH FILES
    ========================= */

    attachButton.addEventListener(
        "click",
        function () {

            fileInput.click();

        }
    );


    fileInput.addEventListener(
        "change",
        function () {

            const files =
                Array.from(
                    fileInput.files || []
                );


            selectedFiles.push(...files);


            /* Maximum 5 files */

            selectedFiles =
                selectedFiles.slice(0, 5);


            renderAttachments();


            /* Allow same file again */

            fileInput.value = "";

        }
    );


    function renderAttachments() {

        attachmentPreview.innerHTML = "";


        selectedFiles.forEach(
            function (file, index) {

                const item =
                    document.createElement("div");

                item.className =
                    "attachment";


                const icon =
                    document.createElement("span");


                if (
                    file.type.startsWith("image/")
                ) {

                    icon.textContent = "🖼️";

                } else if (
                    file.type === "application/pdf"
                ) {

                    icon.textContent = "📕";

                } else if (
                    file.name
                        .toLowerCase()
                        .endsWith(".docx")
                ) {

                    icon.textContent = "📝";

                } else if (
                    file.name
                        .toLowerCase()
                        .endsWith(".doc")
                ) {

                    icon.textContent = "📝";

                } else {

                    icon.textContent = "📄";

                }


                const name =
                    document.createElement("span");

                name.textContent =
                    file.name;


                const remove =
                    document.createElement("button");

                remove.type = "button";

                remove.textContent = "×";

                remove.title =
                    "Remove file";


                remove.addEventListener(
                    "click",
                    function () {

                        selectedFiles.splice(
                            index,
                            1
                        );

                        renderAttachments();

                    }
                );


                item.appendChild(icon);

                item.appendChild(name);

                item.appendChild(remove);

                attachmentPreview.appendChild(item);

            }
        );
    }


    /* =========================
       SEND MESSAGE
    ========================= */

    async function sendMessage() {

        if (waitingForAI) {
            return;
        }


        const text =
            messageInput.value.trim();


        if (
            text === "" &&
            selectedFiles.length === 0
        ) {

            return;
        }


        if (!currentChat) {

            createChat();

        }


        if (
            currentChat.messages.length === 0
        ) {

            currentChat.title =
                makeTitle(
                    text ||
                    selectedFiles[0]?.name ||
                    "New Chat"
                );

        }


        const displayText =
            text ||
            "Please analyze the uploaded file(s).";


        currentChat.messages.push({

            sender: "user",

            text: displayText

        });


        addMessage(
            displayText,
            "user",
            false
        );


        messageInput.value = "";


        saveChats();

        updateHistory();


        waitingForAI = true;

        showTyping();


        try {

            const formData =
                new FormData();


            formData.append(
                "messages",
                JSON.stringify(
                    currentChat.messages.map(
                        function (message) {

                            return {

                                role:
                                    message.sender === "user"
                                        ? "user"
                                        : "assistant",

                                content:
                                    message.text

                            };

                        }
                    )
                )
            );


            selectedFiles.forEach(
                function (file) {

                    formData.append(
                        "files",
                        file
                    );

                }
            );


            const response =
                await fetch(
                    "/api/chat",
                    {
                        method: "POST",

                        body: formData
                    }
                );


            let data;


            try {

                data =
                    await response.json();

            } catch (jsonError) {

                throw new Error(
                    "The server returned an invalid response."
                );

            }


            removeTyping();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Server error."
                );

            }


            const reply =
                data.reply ||
                "I couldn't generate a response.";


            currentChat.messages.push({

                sender: "bot",

                text: reply

            });


            addMessage(
                reply,
                "bot",
                true,
                data.image
            );


            saveChats();


            selectedFiles = [];

            renderAttachments();


        } catch (error) {

            removeTyping();


            console.error(
                "Zono AI error:",
                error
            );


            const errorMessage =
                "Sorry, I couldn't connect to my AI server right now.";


            currentChat.messages.push({

                sender: "bot",

                text: errorMessage

            });


            addMessage(
                errorMessage,
                "bot",
                false
            );


            saveChats();

        } finally {

            waitingForAI = false;

        }
    }


    sendButton.addEventListener(
        "click",
        sendMessage
    );


    /* =========================
       ENTER TO SEND
    ========================= */

    messageInput.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();

            }

        }
    );


    /* =========================
       MESSAGE DISPLAY
    ========================= */

    function addMessage(
        text,
        sender,
        animate,
        image
    ) {

        const message =
            document.createElement("div");

        message.className =
            "message " + sender;


        const content =
            document.createElement("div");

        content.className =
            "message-content";


        const name =
            document.createElement("div");

        name.className =
            "message-name";


        name.textContent =
            sender === "bot"
                ? "Zono AI"
                : "You";


        const bubble =
            document.createElement("div");

        bubble.className =
            "bubble";


        content.appendChild(name);

        content.appendChild(bubble);

        message.appendChild(content);

        chatArea.appendChild(message);


        if (
            sender === "bot" &&
            animate
        ) {

            typeText(
                bubble,
                text
            );

        } else {

            bubble.textContent =
                text;

        }


        /* =========================
           SPEAK BUTTON
        ========================= */

        if (sender === "bot") {

            const speakButton =
                document.createElement("button");

            speakButton.type = "button";

            speakButton.className =
                "speak-button";

            speakButton.textContent =
                "🔊";

            speakButton.title =
                "Read response aloud";


            speakButton.addEventListener(
                "click",
                function () {

                    speakText(text);

                }
            );


            content.appendChild(
                speakButton
            );


            /* =========================
               OPTIONAL AI IMAGE
            ========================= */

            if (
                image &&
                image.url
            ) {

                const imageCard =
                    document.createElement("div");

                imageCard.className =
                    "ai-image-card";


                const img =
                    document.createElement("img");

                img.src =
                    image.url;

                img.alt =
                    image.title ||
                    "Zono AI illustration";

                img.loading =
                    "lazy";


                const caption =
                    document.createElement("div");

                caption.textContent =
                    image.title ||
                    "Illustration";


                imageCard.appendChild(img);

                imageCard.appendChild(caption);

                content.appendChild(
                    imageCard
                );

            }

        }


        scrollBottom();
    }


    /* =========================
       TYPING EFFECT
    ========================= */

    function typeText(
        element,
        text
    ) {

        let index = 0;


        function write() {

            if (
                index >= text.length
            ) {

                return;

            }


            element.textContent +=
                text.charAt(index);


            index++;


            scrollBottom();


            setTimeout(
                write,
                12
            );

        }


        write();

    }


    /* =========================
       TYPING INDICATOR
    ========================= */

    function showTyping() {

        removeTyping();


        const message =
            document.createElement("div");

        message.id =
            "typingIndicator";

        message.className =
            "message bot";


        message.innerHTML = `

            <div class="message-content">

                <div class="message-name">
                    Zono AI
                </div>

                <div class="bubble">

                    <div class="typing">

                        <span></span>
                        <span></span>
                        <span></span>

                    </div>

                </div>

            </div>

        `;


        chatArea.appendChild(message);

        scrollBottom();

    }


    function removeTyping() {

        const typing =
            document.getElementById(
                "typingIndicator"
            );


        if (typing) {

            typing.remove();

        }

    }


    /* =========================
       VOICE INPUT
    ========================= */

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (SpeechRecognition) {

        recognition =
            new SpeechRecognition();


        recognition.continuous =
            false;


        recognition.interimResults =
            false;


        recognition.lang =
            "en-IN";


        recognition.onstart =
            function () {

                voiceButton.classList.add(
                    "recording"
                );


                voiceButton.textContent =
                    "🔴";

            };


        recognition.onend =
            function () {

                voiceButton.classList.remove(
                    "recording"
                );


                voiceButton.textContent =
                    "🎙️";

            };


        recognition.onerror =
            function (event) {

                console.error(
                    "Voice recognition error:",
                    event.error
                );


                voiceButton.classList.remove(
                    "recording"
                );


                voiceButton.textContent =
                    "🎙️";

            };


        recognition.onresult =
            function (event) {

                const transcript =
                    event
                        .results[0][0]
                        .transcript;


                messageInput.value =
                    transcript;


                sendMessage();

            };


        voiceButton.addEventListener(
            "click",
            function () {

                try {

                    recognition.start();

                } catch (error) {

                    console.log(
                        "Voice recognition is already running."
                    );

                }

            }
        );

    } else {

        voiceButton.addEventListener(
            "click",
            function () {

                alert(
                    "Voice input is not supported by this browser."
                );

            }
        );

    }


    /* =========================
       TEXT TO SPEECH
       BROWSER MALE VOICE
    ========================= */

    function getMaleVoice() {

        if (
            !("speechSynthesis" in window)
        ) {

            return null;

        }


        const voices =
            window.speechSynthesis.getVoices();


        if (!voices.length) {

            return null;

        }


        const maleKeywords = [

            "male",
            "david",
            "daniel",
            "alex",
            "mark",
            "george",
            "james",
            "microsoft david",
            "google uk english male"

        ];


        let voice =
            voices.find(
                function (item) {

                    const name =
                        item.name.toLowerCase();


                    return maleKeywords.some(
                        function (keyword) {

                            return name.includes(
                                keyword
                            );

                        }
                    );

                }
            );


        if (!voice) {

            voice =
                voices.find(
                    function (item) {

                        return item.lang
                            .toLowerCase()
                            .startsWith("en");

                    }
                );

        }


        return voice || voices[0];

    }


    function speakText(text) {

        if (
            !("speechSynthesis" in window)
        ) {

            alert(
                "Text-to-speech is not supported by this browser."
            );

            return;

        }


        window.speechSynthesis.cancel();


        const speech =
            new SpeechSynthesisUtterance(
                text
            );


        const voice =
            getMaleVoice();


        if (voice) {

            speech.voice =
                voice;

        }


        speech.rate =
            0.95;


        speech.pitch =
            0.85;


        speech.volume =
            1;


        window.speechSynthesis.speak(
            speech
        );

    }


    /* =========================
       CHAT TITLE
    ========================= */

    function makeTitle(text) {

        let title =
            text
                .replace(/\s+/g, " ")
                .trim();


        if (
            title.length > 26
        ) {

            title =
                title.substring(
                    0,
                    26
                ) + "...";

        }


        return title;

    }


    /* =========================
       CHAT HISTORY
    ========================= */

    function updateHistory() {

        chatHistory.innerHTML =
            "";


        chats.forEach(
            function (chat) {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "chat-card";


                if (
                    currentChat &&
                    chat.id ===
                    currentChat.id
                ) {

                    card.classList.add(
                        "active"
                    );

                }


                card.textContent =
                    "💬  " +
                    chat.title;


                card.addEventListener(
                    "click",
                    function () {

                        currentChat =
                            