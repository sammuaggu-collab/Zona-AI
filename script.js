document.addEventListener("DOMContentLoaded", function () {

    /* =========================
       ELEMENTS
    ========================= */

    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebarBackdrop");

    const menuButton = document.getElementById("menuButton");
    const closeButton = document.getElementById("closeSidebar");

    const newChatButton = document.getElementById("newChatButton");

    const chatArea = document.getElementById("chatArea");
    const chatHistory = document.getElementById("chatHistory");

    const messageInput = document.getElementById("messageInput");
    const sendButton = document.getElementById("sendButton");

    const attachButton = document.getElementById("attachButton");
    const fileInput = document.getElementById("fileInput");
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
       HELPERS
    ========================= */

    function exists(element) {
        return element !== null;
    }


    function scrollBottom() {

        if (!exists(chatArea)) {
            return;
        }

        chatArea.scrollTop =
            chatArea.scrollHeight;
    }


    /* =========================
       SIDEBAR
    ========================= */

    function openSidebar() {

        if (exists(sidebar)) {
            sidebar.classList.add("open");
        }

        if (exists(backdrop)) {
            backdrop.classList.add("show");
        }
    }


    function closeSidebar() {

        if (exists(sidebar)) {
            sidebar.classList.remove("open");
        }

        if (exists(backdrop)) {
            backdrop.classList.remove("show");
        }
    }


    if (exists(menuButton)) {

        menuButton.addEventListener(
            "click",
            openSidebar
        );
    }


    if (exists(closeButton)) {

        closeButton.addEventListener(
            "click",
            closeSidebar
        );
    }


    if (exists(backdrop)) {

        backdrop.addEventListener(
            "click",
            closeSidebar
        );
    }


    /* =========================
       NEW CHAT
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

        if (exists(messageInput)) {
            messageInput.focus();
        }
    }


    if (exists(newChatButton)) {

        newChatButton.addEventListener(
            "click",
            createChat
        );
    }


    /* =========================
       FILE ATTACHMENTS
    ========================= */

    if (
        exists(attachButton) &&
        exists(fileInput)
    ) {

        attachButton.addEventListener(
            "click",
            function () {

                fileInput.click();
            }
        );
    }


    if (exists(fileInput)) {

        fileInput.addEventListener(
            "change",
            function () {

                const files =
                    Array.from(
                        fileInput.files || []
                    );

                selectedFiles.push(...files);

                selectedFiles =
                    selectedFiles.slice(0, 5);

                renderAttachments();

                fileInput.value = "";
            }
        );
    }


    function renderAttachments() {

        if (!exists(attachmentPreview)) {
            return;
        }

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
                    file.type &&
                    file.type.startsWith("image/")
                ) {

                    icon.textContent = "🖼️";

                } else if (
                    file.type ===
                    "application/pdf"
                ) {

                    icon.textContent = "📕";

                } else if (
                    file.name
                        .toLowerCase()
                        .endsWith(".doc") ||
                    file.name
                        .toLowerCase()
                        .endsWith(".docx")
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
            exists(messageInput)
                ? messageInput.value.trim()
                : "";

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
                    (
                        selectedFiles[0]
                            ? selectedFiles[0].name
                            : "New Chat"
                    )
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

        if (exists(messageInput)) {
            messageInput.value = "";
        }

        saveChats();
        updateHistory();

        const filesToSend = [...selectedFiles];

        selectedFiles = [];

        renderAttachments();

        waitingForAI = true;

        showTyping();

        try {

            const formData = new FormData();

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

            filesToSend.forEach(
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

                data = await response.json();

            } catch (error) {

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


    /* =========================
       SEND BUTTON
    ========================= */

    if (exists(sendButton)) {

        sendButton.addEventListener(
            "click",
            sendMessage
        );
    }


    if (exists(messageInput)) {

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
    }


    /* =========================
       DISPLAY MESSAGE
    ========================= */

    function addMessage(
        text,
        sender,
        animate,
        image
    ) {

        if (!exists(chatArea)) {
            return;
        }

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
           READ ALOUD
        ========================= */

        if (sender === "bot") {

            const speakButton =
                document.createElement("button");

            speakButton.type =
                "button";

            speakButton.className =
                "speak-button";

            speakButton.textContent =
                "🔊";

            speakButton.title =
                "Read Zono's response aloud";

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
               AI IMAGE
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

        if (!exists(chatArea)) {
            return;
        }

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

    if (
        SpeechRecognition &&
        exists(voiceButton)
    ) {

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

                console.log(
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
                    event.results[0][0]
                        .transcript;

                if (exists(messageInput)) {

                    messageInput.value =
                        transcript;
                }

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

    } else if (exists(voiceButton)) {

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
    ========================= */

    function getMaleVoice() {

        if (
            !("speechSynthesis" in window)
        ) {
            return null;
        }

        const voices =
            window.speechSynthesis
                .getVoices();

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

        let maleVoice =
            voices.find(
                function (voice) {

                    const name =
                        voice.name.toLowerCase();

                    return maleKeywords.some(
                        function (keyword) {

                            return name.includes(
                                keyword
                            );
                        }
                    );
                }
            );

        if (!maleVoice) {

            maleVoice =
                voices.find(
                    function (voice) {

                        return voice.lang
                            .toLowerCase()
                            .startsWith("en");
                    }
                );
        }

        return maleVoice || voices[0];
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

        const maleVoice =
            getMaleVoice();

        if (maleVoice) {

            speech.voice =
                maleVoice;
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


    if (
        "speechSynthesis" in window
    ) {

        window.speechSynthesis.onvoiceschanged =
            function () {

                window.speechSynthesis
                    .getVoices();
            };
    }


    /* =========================
       CHAT TITLE
    ========================= */

    function makeTitle(text) {

        let title =
            String(text || "")
                .replace(/\s+/g, " ")
                .trim();

        if (title.length > 26) {

            title =
                title.substring(
                    0,
                    26
                ) + "...";
        }

        return title ||
            "New Chat";
    }


    /* =========================
       CHAT HISTORY
    ========================= */

    function updateHistory() {

        if (!exists(chatHistory)) {
            return;
        }

        chatHistory.innerHTML = "";

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
                            chat;

                        selectedFiles = [];

                        renderAttachments();

                        showChat();

                        updateHistory();

                        closeSidebar();
                    }
                );

                chatHistory.appendChild(
                    card
                );
            }
        );
    }


    /* =========================
       STORAGE
    ========================= */

    function saveChats() {

        try {

            localStorage.setItem(
                "zonoChats",
                JSON.stringify(chats)
            );

        } catch (error) {

            console.error(
                "Could not save chats:",
                error
            );
        }
    }


    function loadChats() {

        try {

            const saved =
                localStorage.getItem(
                    "zonoChats"
                );

            if (saved) {

                const parsed =
                    JSON.parse(saved);

                if (Array.isArray(parsed)) {

                    chats =
                        parsed.filter(
                            function (chat) {

                                return (
                                    chat &&
                                    typeof chat ===
                                        "object"
                                );
                            }
                        );

                } else {

                    chats = [];
                }

            } else {

                chats = [];
            }

        } catch (error) {

            console.error(
                "Could not load chats:",
                error
            );

            chats = [];
        }
    }


    /* =========================
       SHOW CHAT
    ========================= */

    function showChat() {

        if (!exists(chatArea)) {
            return;
        }

        chatArea.innerHTML = "";

        if (
            !currentChat ||
            !Array.isArray(
                currentChat.messages
            ) ||
            currentChat.messages.length === 0
        ) {

            const welcome =
                document.createElement(
                    "div"
                );

            welcome.className =
                "welcome";

            welcome.innerHTML = `
                <div class="welcome-logo">
                    Z
                </div>

                <h1>
                    How can I help?
                </h1>

                <p>
                    Ask Zono AI anything.
                </p>
            `;

            chatArea.appendChild(
                welcome
            );

            return;
        }

        currentChat.messages.forEach(
            function (message) {

                if (
                    !message ||
                    !message.text
                ) {
                    return;
                }

                addMessage(
                    message.text,
                    message.sender,
                    false
                );
            }
        );

        scrollBottom();
    }


    /* =========================
       INITIALIZE
    ========================= */

    loadChats();

    if (chats.length > 0) {

        currentChat =
            chats[0];

    } else {

        currentChat = null;
    }

    updateHistory();

    renderAttachments();

    showChat();

});