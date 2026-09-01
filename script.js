document.addEventListener("DOMContentLoaded", function () {

    /* ==========================================
       ELEMENTS
    ========================================== */

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


    /* ==========================================
       STATE
    ========================================== */

    let chats = [];

    let currentChat = null;

    let waitingForAI = false;

    let selectedFiles = [];

    let recognition = null;


    /* ==========================================
       HELPERS
    ========================================== */

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


    function makeTitle(text) {

        if (!text) {
            return "New Chat";
        }

        let title =
            String(text)
                .replace(/\s+/g, " ")
                .trim();

        if (title.length > 30) {
            title =
                title.substring(0, 30) + "...";
        }

        return title || "New Chat";
    }


    /* ==========================================
       LOCAL STORAGE
    ========================================== */

    function saveChats() {

        try {

            localStorage.setItem(
                "zono_chats",
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
                    "zono_chats"
                );

            if (!saved) {
                return;
            }

            const parsed =
                JSON.parse(saved);

            if (Array.isArray(parsed)) {

                chats = parsed;
            }

        } catch (error) {

            console.error(
                "Could not load chats:",
                error
            );

            chats = [];
        }
    }


    /* ==========================================
       SIDEBAR
    ========================================== */

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


    /* ==========================================
       CREATE NEW CHAT
    ========================================== */

    function createChat() {

        const chat = {

            id:
                Date.now(),

            title:
                "New Chat",

            messages:
                []
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

            messageInput.value = "";

            messageInput.focus();
        }
    }


    if (exists(newChatButton)) {

        newChatButton.addEventListener(
            "click",
            createChat
        );
    }


    /* ==========================================
       DELETE CHAT
    ========================================== */

    function deleteChat(chatId) {

        const chat =
            chats.find(function (item) {

                return item.id === chatId;
            });

        if (!chat) {
            return;
        }

        const confirmed =
            confirm(
                `Delete "${chat.title}"?`
            );

        if (!confirmed) {
            return;
        }

        chats =
            chats.filter(function (item) {

                return item.id !== chatId;
            });


        if (
            currentChat &&
            currentChat.id === chatId
        ) {

            currentChat =
                chats.length > 0
                    ? chats[0]
                    : null;
        }


        saveChats();

        updateHistory();


        if (currentChat) {

            showChat();

        } else {

            createChat();
        }
    }


    /* ==========================================
       CHAT HISTORY
    ========================================== */

    function updateHistory() {

        if (!exists(chatHistory)) {
            return;
        }

        chatHistory.innerHTML = "";


        chats.forEach(
            function (chat) {

                const item =
                    document.createElement("div");

                item.className =
                    "chat-history-item";


                if (
                    currentChat &&
                    currentChat.id === chat.id
                ) {

                    item.classList.add(
                        "active"
                    );
                }


                const title =
                    document.createElement("span");

                title.className =
                    "chat-history-title";

                title.textContent =
                    chat.title || "New Chat";


                title.addEventListener(
                    "click",
                    function () {

                        currentChat =
                            chat;

                        selectedFiles =
                            [];

                        renderAttachments();

                        showChat();

                        updateHistory();

                        closeSidebar();
                    }
                );


                const deleteButton =
                    document.createElement("button");

                deleteButton.type =
                    "button";

                deleteButton.className =
                    "delete-chat-button";

                deleteButton.textContent =
                    "🗑️";

                deleteButton.title =
                    "Delete chat";


                deleteButton.addEventListener(
                    "click",
                    function (event) {

                        event.stopPropagation();

                        deleteChat(
                            chat.id
                        );
                    }
                );


                item.appendChild(title);

                item.appendChild(
                    deleteButton
                );

                chatHistory.appendChild(item);
            }
        );
    }


    /* ==========================================
       SHOW CHAT
    ========================================== */

    function showChat() {

        if (!exists(chatArea)) {
            return;
        }

        chatArea.innerHTML = "";


        if (!currentChat) {
            return;
        }


        currentChat.messages.forEach(
            function (message) {

                addMessage(
                    message.text,
                    message.sender,
                    false,
                    message.image
                );
            }
        );


        scrollBottom();
    }


    /* ==========================================
       FILE ATTACHMENTS
    ========================================== */

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


                selectedFiles.push(
                    ...files
                );


                selectedFiles =
                    selectedFiles.slice(
                        0,
                        5
                    );


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
                    document.createElement(
                        "div"
                    );

                item.className =
                    "attachment";


                const icon =
                    document.createElement(
                        "span"
                    );


                if (
                    file.type &&
                    file.type.startsWith(
                        "image/"
                    )
                ) {

                    icon.textContent =
                        "🖼️";

                } else if (
                    file.type ===
                    "application/pdf"
                ) {

                    icon.textContent =
                        "📕";

                } else if (
                    file.name
                        .toLowerCase()
                        .endsWith(".doc") ||
                    file.name
                        .toLowerCase()
                        .endsWith(".docx")
                ) {

                    icon.textContent =
                        "📝";

                } else {

                    icon.textContent =
                        "📄";
                }


                const name =
                    document.createElement(
                        "span"
                    );

                name.textContent =
                    file.name;


                const remove =
                    document.createElement(
                        "button"
                    );

                remove.type =
                    "button";

                remove.textContent =
                    "×";


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

                attachmentPreview.appendChild(
                    item
                );
            }
        );
    }


    /* ==========================================
       SEND MESSAGE
    ========================================== */

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

            sender:
                "user",

            text:
                displayText
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


        const filesToSend =
            [...selectedFiles];


        selectedFiles = [];

        renderAttachments();

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
                                    message.sender ===
                                    "user"
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
                        method:
                            "POST",

                        body:
                            formData
                    }
                );


            let data;


            try {

                data =
                    await response.json();

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

                sender:
                    "bot",

                text:
                    reply,

                image:
                    data.image || null
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

                sender:
                    "bot",

                text:
                    errorMessage
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


    /* ==========================================
       SEND BUTTON
    ========================================== */

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


   /* ==========================================
       DISPLAY MESSAGE
    ========================================== */

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


        /* ==================================
           BOT TEXT
        ================================== */

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


        /* ==================================
           BOT CONTROLS
        ================================== */

        if (sender === "bot") {


            /* ==============================
               READ ALOUD
            ============================== */

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


            /* ==============================
               COPY RESPONSE
            ============================== */

            const copyButton =
                document.createElement("button");

            copyButton.type =
                "button";

            copyButton.className =
                "copy-button";

            copyButton.textContent =
                "📋";

            copyButton.title =
                "Copy response";


            copyButton.addEventListener(
                "click",
                async function () {

                    try {

                        await navigator.clipboard.writeText(
                            text
                        );

                        copyButton.textContent =
                            "✅";

                        setTimeout(
                            function () {

                                copyButton.textContent =
                                    "📋";

                            },
                            1200
                        );

                    } catch (error) {

                        console.log(
                            "Copy failed:",
                            error
                        );
                    }
                }
            );


            content.appendChild(
                copyButton
            );


            /* ==============================
               IMAGE RESULT
            ============================== */

            if (
                image &&
                image.url
            ) {

                createImageCard(
                    content,
                    image
                );
            }
        }


        scrollBottom();
    }


    /* ==========================================
       IMAGE CARD
    ========================================== */

    function createImageCard(
        container,
        image
    ) {

        if (
            !image ||
            !image.url
        ) {
            return;
        }


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
            "Zono AI image";

        img.loading =
            "lazy";


        imageCard.appendChild(
            img
        );


        const caption =
            document.createElement("div");

        caption.className =
            "ai-image-caption";

        caption.textContent =
            image.title ||
            "Image";


        imageCard.appendChild(
            caption
        );


        /* ==================================
           DOWNLOAD IMAGE
        ================================== */

        const downloadButton =
            document.createElement(
                "a"
            );

        downloadButton.className =
            "download-image-button";

        downloadButton.textContent =
            "⬇️ Download image";

        downloadButton.href =
            image.url;

        downloadButton.target =
            "_blank";

        downloadButton.rel =
            "noopener noreferrer";


        /*
           Wikimedia may not allow the browser
           to directly force-download the image.
           Opening it lets the user save/download it.
        */


        imageCard.appendChild(
            downloadButton
        );


        container.appendChild(
            imageCard
        );
    }


    /* ==========================================
       TYPING EFFECT
    ========================================== */

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


    /* ==========================================
       TYPING INDICATOR
    ========================================== */

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


        chatArea.appendChild(
            message
        );


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


    /* ==========================================
       VOICE INPUT
    ========================================== */

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


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


                if (
                    exists(messageInput)
                ) {

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


    } else if (
        exists(voiceButton)
    ) {

        voiceButton.addEventListener(
            "click",
            function () {

                alert(
                    "Voice input is not supported by this browser."
                );
            }
        );
    }


    /* ==========================================
       TEXT TO SPEECH
    ========================================== */

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


        return (
            maleVoice ||
            voices[0]
        );
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


    /* ==========================================
       IMAGE SEARCH
    ========================================== */

    async function searchImage(
        query
    ) {

        if (!query) {
            return null;
        }


        try {

            const response =
                await fetch(
                    "/api/image-search?q=" +
                    encodeURIComponent(query)
                );


            const data =
                await response.json();


            if (
                !response.ok
            ) {

                return null;
            }


            return data.image ||
                null;

        } catch (error) {

            console.error(
                "Image search error:",
                error
            );

            return null;
        }
    }


    /* ==========================================
       IMAGE SEARCH COMMAND
    ========================================== */

    async function handleImageCommand(
        text
    ) {

        if (!text) {
            return false;
        }


        const match =
            text.match(
                /^(?:image|picture|show me an image of|show me a picture of)\s+(.+)/i
            );


        if (!match) {

            return false;
        }


        const query =
            match[1].trim();


        if (!query) {

            return false;
        }


        waitingForAI = true;

        showTyping();


        try {

            const image =
                await searchImage(
                    query
                );


            removeTyping();


            if (!image) {

                const message =
                    "I couldn't find a suitable image.";

                currentChat.messages.push({

                    sender:
                        "bot",

                    text:
                        message
                });


                addMessage(
                    message,
                    "bot",
                    false
                );


                saveChats();

                return true;
            }


            const message =
                `Here is an image of ${query}.`;


            currentChat.messages.push({

                sender:
                    "bot",

                text:
                    message,

                image:
                    image
            });


            addMessage(
                message,
                "bot",
                false,
                image
            );


            saveChats();


        } catch (error) {

            removeTyping();

            console.error(
                "Image command error:",
                error
            );

        } finally {

            waitingForAI = false;
        }


        return true;
    }

    /* ==========================================
       INITIALIZE
    ========================================== */

    loadChats();


    if (chats.length > 0) {

        currentChat =
            chats[0];

        showChat();

    } else {

        createChat();
    }


    updateHistory();

    renderAttachments();


    /* ==========================================
       AUTO RESIZE MESSAGE INPUT
    ========================================== */

    if (exists(messageInput)) {

        messageInput.addEventListener(
            "input",
            function () {

                this.style.height =
                    "auto";

                this.style.height =
                    Math.min(
                        this.scrollHeight,
                        180
                    ) + "px";
            }
        );
    }


    /* ==========================================
       IMAGE COMMAND BEFORE NORMAL CHAT
    ========================================== */

    const originalSendMessage =
        sendMessage;


    async function smartSendMessage() {

        if (waitingForAI) {
            return;
        }


        const text =
            exists(messageInput)
                ? messageInput.value.trim()
                : "";


        /*
         * Image commands are handled locally.
         * Examples:
         *
         * image solar system
         * picture of Taj Mahal
         * show me an image of Earth
         */

        if (
            text &&
            selectedFiles.length === 0
        ) {

            const handled =
                await handleImageCommand(
                    text
                );


            if (handled) {

                if (exists(messageInput)) {

                    messageInput.value =
                        "";

                    messageInput.style.height =
                        "auto";
                }

                return;
            }
        }


        return originalSendMessage();
    }


    /* ==========================================
       REPLACE SEND BUTTON
    ========================================== */

    if (exists(sendButton)) {

        sendButton.onclick =
            function (event) {

                event.preventDefault();

                smartSendMessage();
            };
    }


    /* ==========================================
       REPLACE ENTER KEY
    ========================================== */

    if (exists(messageInput)) {

        messageInput.onkeydown =
            function (event) {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    smartSendMessage();
                }
            };
    }


    /* ==========================================
       CLEAR EMPTY NEW CHAT
    ========================================== */

    function cleanEmptyChats() {

        chats =
            chats.filter(
                function (chat) {

                    return (
                        chat.messages &&
                        chat.messages.length > 0
                    );
                }
            );


        if (
            currentChat &&
            !chats.includes(currentChat)
        ) {

            currentChat =
                chats.length
                    ? chats[0]
                    : null;
        }


        saveChats();

        updateHistory();
    }


    /* ==========================================
       PAGE VISIBILITY SAVE
    ========================================== */

    document.addEventListener(
        "visibilitychange",
        function () {

            if (
                document.visibilityState ===
                "hidden"
            ) {

                saveChats();
            }
        }
    );


    window.addEventListener(
        "beforeunload",
        function () {

            saveChats();
        }
    );


    /* ==========================================
       GLOBAL ZONO FUNCTIONS
    ========================================== */

    window.ZonoAI = {

        newChat:
            createChat,

        deleteChat:
            deleteChat,

        searchImage:
            searchImage,

        speak:
            speakText,

        save:
            saveChats,

        reloadChats:
            function () {

                loadChats();

                updateHistory();

                if (currentChat) {
                    showChat();
                }
            }
    };


    /* ==========================================
       DEBUG / STARTUP MESSAGE
    ========================================== */

    console.log(
        "======================================"
    );

    console.log(
        "        ZONO AI FRONTEND ONLINE"
    );

    console.log(
        "======================================"
    );

    console.log(
        "Chat history: enabled"
    );

    console.log(
        "Chat deletion: enabled"
    );

    console.log(
        "File uploads: enabled"
    );

    console.log(
        "Image analysis: enabled"
    );

    console.log(
        "Image search: enabled"
    );

    console.log(
        "Voice input: enabled"
    );

    console.log(
        "Text-to-speech: enabled"
    );

    console.log(
        "======================================"
    );

});