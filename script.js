document.addEventListener("DOMContentLoaded", function () {

    /* ==========================================
       ELEMENTS
    ========================================== */

    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebarBackdrop");

    const menuButton = document.getElementById("menuButton");
    const closeButton = document.getElementById("closeSidebar");

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
        return element !== null &&
               element !== undefined;
    }


    function scrollBottom() {

        if (!exists(chatArea)) {
            return;
        }

        chatArea.scrollTop =
            chatArea.scrollHeight;
    }


    function generateId() {

        return Date.now() +
            Math.floor(Math.random() * 10000);
    }


    function makeTitle(text) {

        if (!text) {
            return "New Chat";
        }

        const clean =
            String(text)
                .replace(/\s+/g, " ")
                .trim();

        if (!clean) {
            return "New Chat";
        }

        return clean.length > 32
            ? clean.substring(0, 32) + "..."
            : clean;
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

                chats = [];

                return;
            }

            const parsed =
                JSON.parse(saved);

            if (Array.isArray(parsed)) {

                chats = parsed;

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

            id: generateId(),

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

            messageInput.value = "";

            messageInput.style.height =
                "auto";

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
       CLEAR CURRENT CHAT
    ========================================== */

    function clearCurrentChat() {

        if (!currentChat) {
            return;
        }


        if (
            currentChat.messages.length === 0
        ) {
            return;
        }


        const confirmed =
            window.confirm(
                "Clear all messages from this chat?"
            );


        if (!confirmed) {
            return;
        }


        currentChat.messages = [];


        saveChats();

        showChat();

        updateHistory();


        if (exists(messageInput)) {

            messageInput.value = "";

            messageInput.focus();
        }
    }


    /*
       Allows HTML to call:
       ZonoAI.clearChat()
    */

    window.clearZonoChat =
        clearCurrentChat;


    /* ==========================================
       DELETE CHAT
    ========================================== */

    function deleteChat(chatId) {

        const index =
            chats.findIndex(
                function (chat) {

                    return chat.id === chatId;
                }
            );


        if (index === -1) {
            return;
        }


        const chat =
            chats[index];


        const confirmed =
            window.confirm(
                `Delete "${chat.title}"?`
            );


        if (!confirmed) {
            return;
        }


        const deletedWasCurrent =
            currentChat &&
            currentChat.id === chatId;


        chats.splice(
            index,
            1
        );


        if (deletedWasCurrent) {

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
                    document.createElement(
                        "div"
                    );

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


                /* CHAT TITLE */

                const title =
                    document.createElement(
                        "button"
                    );

                title.type =
                    "button";

                title.className =
                    "chat-title";

                title.textContent =
                    chat.title ||
                    "New Chat";


                title.addEventListener(
                    "click",
                    function () {

                        currentChat =
                            chat;

                        showChat();

                        updateHistory();

                        closeSidebar();
                    }
                );


                /* DELETE BUTTON */

                const deleteButton =
                    document.createElement(
                        "button"
                    );

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

                        event.preventDefault();

                        event.stopPropagation();


                        /*
                         * Animation before deletion
                         */

                        item.classList.add(
                            "deleting"
                        );


                        deleteButton.disabled =
                            true;


                        setTimeout(
                            function () {

                                deleteChat(
                                    chat.id
                                );

                            },
                            220
                        );
                    }
                );


                item.appendChild(title);

                item.appendChild(
                    deleteButton
                );


                chatHistory.appendChild(
                    item
                );
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
       ATTACHMENTS
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

            messageInput.style.height =
                "auto";
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

                data =
                    await response.json();

            } catch {

                throw new Error(
                    "The server returned an invalid response."
                );
            }


            removeTyping();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "AI server error."
                );
            }


            const reply =
                data.reply ||
                "I couldn't generate a response.";


            currentChat.messages.push({

                sender: "bot",

                text: reply,

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


            /*
             * Show the real server error.
             * This makes debugging much easier.
             */

            const errorMessage =
                "⚠️ Zono AI error: " +
                (
                    error?.message ||
                    "Unknown server error."
                );


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


    /* ==========================================
       SEND BUTTON
    ========================================== */

    if (exists(sendButton)) {

        sendButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                sendMessage();
            }
        );
    }


    /* ==========================================
       ENTER TO SEND
    ========================================== */

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
            document.createElement(
                "div"
            );

        message.className =
            "message " + sender;


        const content =
            document.createElement(
                "div"
            );

        content.className =
            "message-content";


        const name =
            document.createElement(
                "div"
            );

        name.className =
            "message-name";

        name.textContent =
            sender === "bot"
                ? "Zono AI"
                : "You";


        const bubble =
            document.createElement(
                "div"
            );

        bubble.className =
            "bubble";


        content.appendChild(name);

        content.appendChild(bubble);

        message.appendChild(content);

        chatArea.appendChild(message);


        /* ======================================
           MESSAGE TEXT
        ====================================== */

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


        /* ======================================
           BOT ACTIONS
        ====================================== */

        if (sender === "bot") {


            const actions =
                document.createElement(
                    "div"
                );

            actions.className =
                "message-actions";


            /* ==============================
               COPY BUTTON
            ============================== */

            const copyButton =
                document.createElement(
                    "button"
                );

            copyButton.type =
                "button";

            copyButton.className =
                "message-action copy-button";

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
                            "✓";

                        copyButton.classList.add(
                            "copied"
                        );


                        setTimeout(
                            function () {

                                copyButton.textContent =
                                    "📋";

                                copyButton.classList.remove(
                                    "copied"
                                );

                            },
                            1200
                        );


                    } catch (error) {

                        console.error(
                            "Copy failed:",
                            error
                        );

                    }
                }
            );


            /* ==============================
               SPEAK BUTTON
            ============================== */

            const speakButton =
                document.createElement(
                    "button"
                );

            speakButton.type =
                "button";

            speakButton.className =
                "message-action speak-button";

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


            actions.appendChild(
                copyButton
            );

            actions.appendChild(
                speakButton
            );


            content.appendChild(
                actions
            );


            /* =================================
               IMAGE RESULT
            ================================= */

            if (
                image &&
                image.url
            ) {

                const imageCard =
                    document.createElement(
                        "div"
                    );

                imageCard.className =
                    "ai-image-card";


                const img =
                    document.createElement(
                        "img"
                    );

                img.src =
                    image.url;

                img.alt =
                    image.title ||
                    "Zono AI image";

                img.loading =
                    "lazy";


                /* IMAGE LOAD ERROR */

                img.onerror =
                    function () {

                        imageCard.remove();
                    };


                const caption =
                    document.createElement(
                        "div"
                    );

                caption.className =
                    "image-caption";

                caption.textContent =
                    image.title ||
                    "Image";


                /* ==========================
                   IMAGE DOWNLOAD
                ========================== */

                const downloadButton =
                    document.createElement(
                        "a"
                    );

                downloadButton.className =
                    "image-download-button";

                downloadButton.textContent =
                    "⬇️ Download";

                downloadButton.href =
                    image.url;

                downloadButton.target =
                    "_blank";

                downloadButton.rel =
                    "noopener noreferrer";


                imageCard.appendChild(img);

                imageCard.appendChild(
                    caption
                );

                imageCard.appendChild(
                    downloadButton
                );


                content.appendChild(
                    imageCard
                );
            }
        }


        scrollBottom();
    }


    /* ==========================================
       TYPING EFFECT
    ========================================== */

    function typeText(
        element,
        text
    ) {

        if (!element) {
            return;
        }


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
                8
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
            document.createElement(
                "div"
            );

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
       IMAGE SEARCH
    ========================================== */

    async function searchImage(query) {

        if (!query) {
            return null;
        }


        try {

            const response =
                await fetch(
                    "https://commons.wikimedia.org/w/api.php?" +
                    new URLSearchParams({

                        action: "query",

                        generator: "search",

                        gsrsearch: query,

                        gsrnamespace: "6",

                        gsrlimit: "1",

                        prop: "imageinfo",

                        iiprop: "url",

                        iiurlwidth: "900",

                        format: "json",

                        origin: "*"
                    })
                );


            if (!response.ok) {
                return null;
            }


            const data =
                await response.json();


            const pages =
                data?.query?.pages;


            if (!pages) {
                return null;
            }


            const first =
                Object.values(pages)[0];


            const info =
                first?.imageinfo?.[0];


            if (!info) {
                return null;
            }


            return {

                title:
                    first.title
                        ?.replace(
                            /^File:/,
                            ""
                        ) ||
                    "Image",

                url:
                    info.thumburl ||
                    info.url
            };


        } catch (error) {

            console.error(
                "Image search failed:",
                error
            );

            return null;
        }
    }


    /* ==========================================
       IMAGE COMMAND HANDLER
    ========================================== */

    async function handleImageCommand(
        text
    ) {

        const lower =
            text.toLowerCase().trim();


        const commands = [
            "image ",
            "picture ",
            "photo ",
            "show me an image of ",
            "show me a picture of ",
            "show image of ",
            "show picture of "
        ];


        let query = null;


        for (
            const command
            of commands
        ) {

            if (
                lower.startsWith(command)
            ) {

                query =
                    text.substring(
                        command.length
                    ).trim();

                break;
            }
        }


        if (!query) {
            return false;
        }


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


            if (!currentChat) {
                createChat();
            }


            currentChat.messages.push({

                sender: "user",

                text: text
            });


            addMessage(
                text,
                "user",
                false
            );


            if (image) {

                const responseText =
                    `Here's an image for "${query}".`;


                currentChat.messages.push({

                    sender: "bot",

                    text: responseText,

                    image: image
                });


                addMessage(
                    responseText,
                    "bot",
                    true,
                    image
                );


            } else {

                const responseText =
                    "I couldn't find a suitable image for that.";

                currentChat.messages.push({

                    sender: "bot",

                    text: responseText
                });


                addMessage(
                    responseText,
                    "bot",
                    false
                );
            }


            saveChats();

            updateHistory();


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
       VOICE INPUT
    ========================================== */

    const SpeechRecognitionAPI =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (
        SpeechRecognitionAPI &&
        exists(voiceButton)
    ) {

        recognition =
            new SpeechRecognitionAPI();


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


    /* ==========================================
       TEXT TO SPEECH
    ========================================== */

    function getBestVoice() {

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


        const preferred =
            [
                "Google UK English Male",
                "Microsoft David",
                "David",
                "Daniel",
                "Alex",
                "Mark",
                "George",
                "James"
            ];


        for (
            const keyword
            of preferred
        ) {

            const found =
                voices.find(
                    function (voice) {

                        return voice.name
                            .toLowerCase()
                            .includes(
                                keyword.toLowerCase()
                            );
                    }
                );


            if (found) {
                return found;
            }
        }


        return (
            voices.find(
                function (voice) {

                    return voice.lang
                        .toLowerCase()
                        .startsWith("en");
                }
            ) ||
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


        const voice =
            getBestVoice();


        if (voice) {
            speech.voice = voice;
        }


        speech.rate =
            0.95;

        speech.pitch =
            0.9;

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
       INPUT AUTO RESIZE
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
       LOAD SAVED CHATS
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
       GLOBAL ZONO FUNCTIONS
    ========================================== */

    window.ZonoAI = {

        newChat:
            createChat,

        deleteChat:
            deleteChat,

        clearChat:
            clearCurrentChat,

        copy:
            function (text) {

                if (
                    navigator.clipboard
                ) {

                    return navigator.clipboard
                        .writeText(text);
                }

                return Promise.reject(
                    new Error(
                        "Clipboard unavailable"
                    )
                );
            },

        speak:
            speakText,

        searchImage:
            searchImage,

        save:
            saveChats
    };


    /* ==========================================
       CLEAN EMPTY CHATS
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


        saveChats();

        updateHistory();
    }


    /* ==========================================
       SAVE BEFORE LEAVING
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
       STARTUP LOG
    ========================================== */

    console.log(
        "================================"
    );

    console.log(
        "       ZONO AI ONLINE"
    );

    console.log(
        "================================"
    );

    console.log(
        "Chat history: ON"
    );

    console.log(
        "Delete chat: ON"
    );

    console.log(
        "Clear chat: ON"
    );

    console.log(
        "Copy responses: ON"
    );

    console.log(
        "Image search: ON"
    );

    console.log(
        "Image download: ON"
    );

    console.log(
        "File upload: ON"
    );

    console.log(
        "Voice input: ON"
    );

    console.log(
        "Text to speech: ON"
    );

    console.log(
        "================================"
    );

});