document.addEventListener("DOMContentLoaded", function () {

    /* ==========================================
       ZONO AI
       COMPLETE SCRIPT.JS
       PART 1 / 3
       ========================================== */

    "use strict";


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

    const chatHistory =
        document.getElementById("chatHistory");

    const chatArea =
        document.getElementById("chatArea");

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
       CONFIG
       ========================================== */

    /*
       Empty string means:
       use the same domain as Zono AI.

       Example:
       https://zona-ai.onrender.com/api/chat
    */

    const API_BASE = "";


    /* ==========================================
       STATE
       ========================================== */

    let chats = [];

    let currentChatId = null;

    let selectedFiles = [];

    let isGenerating = false;

    let speechRecognition = null;


    /* ==========================================
       STORAGE KEY
       ========================================== */

    const STORAGE_KEY =
        "zono_ai_chat_history_v2";


    /* ==========================================
       BASIC HELPERS
       ========================================== */

    function getCurrentChat() {

        return chats.find(
            function (chat) {
                return chat.id === currentChatId;
            }
        ) || null;
    }


    function makeId() {

        return (
            Date.now().toString(36) +
            Math.random()
                .toString(36)
                .slice(2)
        );

    }


    function escapeHTML(text) {

        const div =
            document.createElement("div");

        div.textContent =
            String(text ?? "");

        return div.innerHTML;

    }


    function saveChats() {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(chats)
            );

        } catch (error) {

            console.error(
                "Zono storage error:",
                error
            );

        }

    }


    function loadChats() {

        try {

            const saved =
                localStorage.getItem(
                    STORAGE_KEY
                );


            if (!saved) {

                chats = [];

                return;

            }


            const parsed =
                JSON.parse(saved);


            if (
                Array.isArray(parsed)
            ) {

                chats = parsed;

            } else {

                chats = [];

            }

        } catch (error) {

            console.error(
                "Could not load Zono chats:",
                error
            );

            chats = [];

        }

    }


    /* ==========================================
       MESSAGE TEXT FORMAT
       ========================================== */

    function formatText(text) {

        let value =
            escapeHTML(text);


        /*
           Code blocks
        */

        value =
            value.replace(
                /```([\s\S]*?)```/g,
                "<pre><code>$1</code></pre>"
            );


        /*
           Inline code
        */

        value =
            value.replace(
                /`([^`]+)`/g,
                "<code>$1</code>"
            );


        /*
           Bold
        */

        value =
            value.replace(
                /\*\*(.*?)\*\*/g,
                "<strong>$1</strong>"
            );


        /*
           Italic
        */

        value =
            value.replace(
                /\*(.*?)\*/g,
                "<em>$1</em>"
            );


        return value;

    }


    /* ==========================================
       SCROLL CHAT
       ========================================== */

    function scrollToBottom() {

        if (!chatArea) {
            return;
        }


        requestAnimationFrame(
            function () {

                chatArea.scrollTop =
                    chatArea.scrollHeight;

            }
        );

    }


    /* ==========================================
       SIDEBAR
       ========================================== */

    function openSidebar() {

        if (sidebar) {

            sidebar.classList.add(
                "open"
            );

        }


        if (backdrop) {

            backdrop.classList.add(
                "show"
            );

        }

    }


    function closeSidebarMenu() {

        if (sidebar) {

            sidebar.classList.remove(
                "open"
            );

        }


        if (backdrop) {

            backdrop.classList.remove(
                "show"
            );

        }

    }


    if (menuButton) {

        menuButton.addEventListener(
            "click",
            openSidebar
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeSidebarMenu
        );

    }


    if (backdrop) {

        backdrop.addEventListener(
            "click",
            closeSidebarMenu
        );

    }


    /* ==========================================
       NEW CHAT
       ========================================== */

    function createNewChat() {

        const chat = {

            id:
                makeId(),

            title:
                "New Chat",

            messages:
                []

        };


        chats.unshift(chat);

        currentChatId =
            chat.id;


        selectedFiles =
            [];


        renderAttachments();

        renderHistory();

        renderMessages();

        saveChats();

        closeSidebarMenu();


        if (messageInput) {

            messageInput.value =
                "";

            messageInput.focus();

        }

    }


    if (newChatButton) {

        newChatButton.addEventListener(
            "click",
            createNewChat
        );

    }


    /* ==========================================
       CHAT TITLE
       ========================================== */

    function makeTitle(text) {

        const clean =
            String(text || "")
                .replace(/\s+/g, " ")
                .trim();


        if (!clean) {

            return "New Chat";

        }


        if (clean.length <= 32) {

            return clean;

        }


        return (
            clean.slice(0, 32) +
            "..."
        );

    }


    /* ==========================================
       CHAT HISTORY
       ========================================== */

    function renderHistory() {

        if (!chatHistory) {
            return;
        }


        chatHistory.innerHTML =
            "";


        chats.forEach(
            function (chat) {

                const card =
                    document.createElement(
                        "div"
                    );


                /*
                   IMPORTANT:
                   Your OG CSS uses
                   .chat-card.
                */

                card.className =
                    "chat-card";


                if (
                    chat.id ===
                    currentChatId
                ) {

                    card.classList.add(
                        "active"
                    );

                }


                card.textContent =
                    chat.title ||
                    "New Chat";


                card.addEventListener(
                    "click",
                    function () {

                        currentChatId =
                            chat.id;


                        selectedFiles =
                            [];


                        renderAttachments();

                        renderHistory();

                        renderMessages();

                        closeSidebarMenu();

                    }
                );


                chatHistory.appendChild(
                    card
                );

            }
        );

    }


    /* ==========================================
       WELCOME SCREEN
       ========================================== */

    function showWelcome() {

        if (!chatArea) {
            return;
        }


        chatArea.innerHTML = `

            <div
                class="welcome"
                id="welcome"
            >

                <div class="welcome-logo">
                    Z
                </div>

                <h1>
                    Welcome to Zono AI
                </h1>

                <p>
                    Your AI. Your world.
                </p>

            </div>

        `;

    }


    /* ==========================================
       RENDER ALL MESSAGES
       ========================================== */

    function renderMessages() {

        if (!chatArea) {
            return;
        }


        const chat =
            getCurrentChat();


        if (
            !chat ||
            !Array.isArray(
                chat.messages
            ) ||
            chat.messages.length === 0
        ) {

            showWelcome();

            return;

        }


        chatArea.innerHTML =
            "";


        chat.messages.forEach(
            function (message) {

                renderSingleMessage(
                    message,
                    false
                );

            }
        );


        scrollToBottom();

    }


    /* ==========================================
       PREPARE MESSAGE ELEMENT
       ========================================== */

    function createMessageElement(
        message
    ) {

        const isUser =
            message.role === "user";


        /*
           This exactly matches
           your OG CSS:
           
           .message
           .message.user
           .message.bot
           .message-content
           .message-name
           .bubble
        */

        const wrapper =
            document.createElement(
                "div"
            );


        wrapper.className =
            "message " +
            (
                isUser
                    ? "user"
                    : "bot"
            );


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
            isUser
                ? "You"
                : "Zono AI";


        const bubble =
            document.createElement(
                "div"
            );


        bubble.className =
            "bubble";


        content.appendChild(
            name
        );


        content.appendChild(
            bubble
        );


        wrapper.appendChild(
            content
        );


        return {
            wrapper,
            content,
            name,
            bubble
        };

    }


    /* ==========================================
       RENDER SINGLE MESSAGE
       ========================================== */

    function renderSingleMessage(
        message,
        animate
    ) {

        if (!chatArea) {
            return;
        }


        const elements =
            createMessageElement(
                message
            );


        const bubble =
            elements.bubble;


        /*
           Generated image
        */

        if (
            message.image &&
            message.image.url
        ) {

            addImageCard(
                elements.content,
                message.image
            );

        }


        /*
           Text
        */

        if (
            message.text &&
            String(
                message.text
            ).trim()
        ) {

            if (
                animate &&
                message.role !== "user"
            ) {

                typeText(
                    bubble,
                    message.text
                );

            } else {

                bubble.innerHTML =
                    formatText(
                        message.text
                    );

            }

        }


        /*
           Voice button for AI replies
        */

        if (
            message.role !== "user" &&
            message.text
        ) {

            addSpeakButton(
                elements.content,
                message.text
            );

        }


        chatArea.appendChild(
            elements.wrapper
        );


        scrollToBottom();


        return elements.wrapper;

    }


      /* ==========================================
       AI IMAGE CARD
       ========================================== */

    function addImageCard(content, image) {

        if (!content || !image || !image.url) {
            return;
        }

        const card =
            document.createElement("div");

        card.className =
            "ai-image-card";

        const img =
            document.createElement("img");

        img.src =
            image.url;

        img.alt =
            image.prompt ||
            "Generated image";

        img.loading =
            "lazy";

        const caption =
            document.createElement("div");

        caption.textContent =
            image.prompt
                ? "Generated: " + image.prompt
                : "Generated by Zono AI";

        card.appendChild(img);
        card.appendChild(caption);

        content.appendChild(card);
    }


    /* ==========================================
       SPEAK AI MESSAGE
       ========================================== */

    function addSpeakButton(
        content,
        text
    ) {

        if (!content || !text) {
            return;
        }

        if (
            !("speechSynthesis" in window)
        ) {
            return;
        }

        const button =
            document.createElement("button");

        button.type =
            "button";

        button.className =
            "speak-button";

        button.textContent =
            "🔊 Speak";

        button.addEventListener(
            "click",
            function () {

                try {

                    window.speechSynthesis
                        .cancel();

                    const utterance =
                        new SpeechSynthesisUtterance(
                            String(text)
                        );

                    utterance.onstart =
                        function () {
                            button.textContent =
                                "⏹ Stop";
                        };

                    utterance.onend =
                        function () {
                            button.textContent =
                                "🔊 Speak";
                        };

                    utterance.onerror =
                        function () {
                            button.textContent =
                                "🔊 Speak";
                        };

                    window.speechSynthesis
                        .speak(utterance);

                } catch (error) {

                    console.error(
                        "Speech error:",
                        error
                    );

                }

            }
        );

        content.appendChild(
            button
        );
    }


    /* ==========================================
       TYPE AI RESPONSE
       ========================================== */

    function typeText(
        element,
        text
    ) {

        if (!element) {
            return;
        }

        const value =
            String(text ?? "");

        element.innerHTML =
            "";

        let index = 0;

        const speed =
            value.length > 1000
                ? 2
                : 8;

        function typeNext() {

            if (index >= value.length) {

                element.innerHTML =
                    formatText(value);

                scrollToBottom();

                return;
            }

            index++;

            element.innerHTML =
                formatText(
                    value.slice(
                        0,
                        index
                    )
                );

            scrollToBottom();

            setTimeout(
                typeNext,
                speed
            );
        }

        typeNext();
    }


    /* ==========================================
       RENDER TYPING INDICATOR
       ========================================== */

    function showTyping() {

        if (!chatArea) {
            return null;
        }

        const wrapper =
            document.createElement(
                "div"
            );

        wrapper.className =
            "message bot";

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
            "Zono AI";

        const bubble =
            document.createElement(
                "div"
            );

        bubble.className =
            "bubble";

        const typing =
            document.createElement(
                "div"
            );

        typing.className =
            "typing";

        typing.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;

        bubble.appendChild(
            typing
        );

        content.appendChild(
            name
        );

        content.appendChild(
            bubble
        );

        wrapper.appendChild(
            content
        );

        chatArea.appendChild(
            wrapper
        );

        scrollToBottom();

        return wrapper;
    }


    /* ==========================================
       REMOVE TYPING INDICATOR
       ========================================== */

    function removeTyping(
        typingElement
    ) {

        if (
            typingElement &&
            typingElement.parentNode
        ) {
            typingElement.parentNode
                .removeChild(
                    typingElement
                );
        }
    }


    /* ==========================================
       ATTACHMENTS
       ========================================== */

    function renderAttachments() {

        if (!attachmentPreview) {
            return;
        }

        attachmentPreview.innerHTML =
            "";

        selectedFiles.forEach(
            function (file, index) {

                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "attachment";

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

                remove.setAttribute(
                    "aria-label",
                    "Remove " +
                    file.name
                );

                remove.addEventListener(
                    "click",
                    function () {

                        selectedFiles
                            .splice(
                                index,
                                1
                            );

                        renderAttachments();

                    }
                );

                item.appendChild(
                    name
                );

                item.appendChild(
                    remove
                );

                attachmentPreview
                    .appendChild(
                        item
                    );
            }
        );
    }


    /* ==========================================
       FILE SELECTION
       ========================================== */

    if (attachButton && fileInput) {

        attachButton.addEventListener(
            "click",
            function () {

                if (isGenerating) {
                    return;
                }

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

                if (!files.length) {
                    return;
                }

                files.forEach(
                    function (file) {

                        const exists =
                            selectedFiles.some(
                                function (item) {
                                    return (
                                        item.name ===
                                        file.name &&
                                        item.size ===
                                        file.size &&
                                        item.lastModified ===
                                        file.lastModified
                                    );
                                }
                            );

                        if (!exists) {
                            selectedFiles.push(
                                file
                            );
                        }

                    }
                );

                renderAttachments();

                /*
                   Reset input so the same
                   file can be selected again.
                */

                fileInput.value =
                    "";

            }
        );
    }


    /* ==========================================
       FILE → BASE64
       ========================================== */

    function fileToBase64(file) {

        return new Promise(
            function (resolve, reject) {

                const reader =
                    new FileReader();

                reader.onload =
                    function () {

                        const result =
                            String(
                                reader.result || ""
                            );

                        /*
                           Remove:
                           data:image/png;base64,
                           and keep only base64.
                        */

                        const comma =
                            result.indexOf(",");

                        resolve(
                            comma >= 0
                                ? result.slice(
                                    comma + 1
                                )
                                : result
                        );
                    };

                reader.onerror =
                    function () {
                        reject(
                            reader.error ||
                            new Error(
                                "Could not read file."
                            )
                        );
                    };

                reader.readAsDataURL(
                    file
                );
            }
        );
    }


    /* ==========================================
       BUILD ATTACHMENT DATA
       ========================================== */

    async function prepareFiles() {

        const result = [];

        for (
            const file of selectedFiles
        ) {

            const type =
                file.type ||
                "application/octet-stream";

            /*
               Images are sent to the vision
               endpoint as base64.
            */

            if (
                type.startsWith(
                    "image/"
                )
            ) {

                const base64 =
                    await fileToBase64(
                        file
                    );

                result.push({
                    name:
                        file.name,
                    type:
                        type,
                    data:
                        base64
                });

                continue;
            }


            /*
               Documents are sent as base64
               so the server can extract text.
            */

            const base64 =
                await fileToBase64(
                    file
                );

            result.push({
                name:
                    file.name,
                type:
                    type,
                data:
                    base64
            });

        }

        return result;
    }


    /* ==========================================
       API REQUEST
       ========================================== */

    async function requestZono(
        message,
        files
    ) {

        const response =
            await fetch(
                API_BASE +
                "/api/chat",
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            message:
                                message,

                            files:
                                files || []
                        })
                }
            );


        let data = null;

        try {

            data =
                await response.json();

        } catch (error) {

            throw new Error(
                "The server returned an invalid response."
            );
        }


        if (!response.ok) {

            throw new Error(
                data &&
                (
                    data.error ||
                    data.message
                )
                    ? (
                        data.error ||
                        data.message
                    )
                    : (
                        "Server error " +
                        response.status
                    )
            );
        }


        return data;
    }


    /* ==========================================
       IMAGE GENERATION REQUEST
       ========================================== */

    async function requestImage(
        prompt
    ) {

        const response =
            await fetch(
                API_BASE +
                "/api/image",
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            prompt:
                                prompt
                        })
                }
            );


        let data = null;

        try {

            data =
                await response.json();

        } catch (error) {

            throw new Error(
                "The image server returned an invalid response."
            );
        }


        if (!response.ok) {

            throw new Error(
                data &&
                (
                    data.error ||
                    data.message
                )
                    ? (
                        data.error ||
                        data.message
                    )
                    : (
                        "Image generation failed."
                    )
            );
        }


        return data;
    }


    /* ==========================================
       ADD USER MESSAGE
       ========================================== */

    function addUserMessage(
        text
    ) {

        const chat =
            getCurrentChat();

        if (!chat) {
            return null;
        }

        const message = {
            id:
                makeId(),

            role:
                "user",

            text:
                String(text || ""),

            time:
                Date.now()
        };

        chat.messages.push(
            message
        );

        if (
            chat.title ===
                "New Chat" &&
            text
        ) {
            chat.title =
                makeTitle(text);
        }

        renderSingleMessage(
            message,
            false
        );

        renderHistory();

        saveChats();

        return message;
    }


    /* ==========================================
       ADD AI MESSAGE
       ========================================== */

    function addAIMessage(
        text,
        image
    ) {

        const chat =
            getCurrentChat();

        if (!chat) {
            return null;
        }

        const message = {
            id:
                makeId(),

            role:
                "assistant",

            text:
                String(text || ""),

            time:
                Date.now()
        };

        if (
            image &&
            image.url
        ) {
            message.image =
                image;
        }

        chat.messages.push(
            message
        );

        renderSingleMessage(
            message,
            true
        );

        saveChats();

        return message;
    }


     /* ==========================================
       ENSURE CHAT EXISTS
       ========================================== */

    function ensureCurrentChat() {

        if (getCurrentChat()) {
            return;
        }

        const chat = {
            id:
                makeId(),

            title:
                "New Chat",

            messages:
                []
        };

        chats.unshift(chat);

        currentChatId =
            chat.id;

        saveChats();
    }


    /* ==========================================
       IMAGE COMMAND
       ========================================== */

    function getImagePrompt(text) {

        const value =
            String(text || "").trim();

        if (
            value.toLowerCase()
                .startsWith("/image ")
        ) {
            return value
                .slice(7)
                .trim();
        }

        if (
            value.toLowerCase()
                .startsWith("/imagine ")
        ) {
            return value
                .slice(9)
                .trim();
        }

        return null;
    }


    /* ==========================================
       SEND MESSAGE
       ========================================== */

    async function sendMessage() {

        if (isGenerating) {
            return;
        }

        if (!messageInput) {
            return;
        }

        const text =
            messageInput.value.trim();

        if (
            !text &&
            selectedFiles.length === 0
        ) {
            return;
        }

        ensureCurrentChat();

        const chat =
            getCurrentChat();

        if (!chat) {
            return;
        }

        isGenerating =
            true;

        if (sendButton) {
            sendButton.disabled =
                true;
        }

        if (attachButton) {
            attachButton.disabled =
                true;
        }

        const files =
            selectedFiles.slice();

        /*
           Clear composer immediately.
        */

        messageInput.value =
            "";

        selectedFiles =
            [];

        renderAttachments();


        /*
           Add the user's message.
        */

        let displayText =
            text;

        if (
            !displayText &&
            files.length
        ) {
            displayText =
                "Attached " +
                files.length +
                (
                    files.length === 1
                        ? " file."
                        : " files."
                );
        }

        addUserMessage(
            displayText
        );


        /*
           Check for image command.
           
           Example:
           /image a futuristic city
        */

        const imagePrompt =
            getImagePrompt(text);

        const typing =
            showTyping();


        try {

            /*
               IMAGE GENERATION
            */

            if (imagePrompt) {

                if (!imagePrompt) {
                    throw new Error(
                        "Please enter an image prompt."
                    );
                }

                const result =
                    await requestImage(
                        imagePrompt
                    );

                removeTyping(
                    typing
                );

                const image =
                    result &&
                    (
                        result.image ||
                        result.data
                    );

                let imageUrl = null;

                if (
                    image &&
                    image.url
                ) {
                    imageUrl =
                        image.url;
                }

                if (
                    !imageUrl &&
                    result &&
                    result.url
                ) {
                    imageUrl =
                        result.url;
                }

                if (!imageUrl) {

                    throw new Error(
                        "The image server did not return an image."
                    );
                }

                addAIMessage(
                    result.text ||
                    "Here is your generated image.",
                    {
                        url:
                            imageUrl,

                        prompt:
                            imagePrompt
                    }
                );

                return;
            }


            /*
               NORMAL AI CHAT
            */

            const preparedFiles =
                await prepareFiles();

            const result =
                await requestZono(
                    text,
                    preparedFiles
                );

            removeTyping(
                typing
            );

            const reply =
                result &&
                (
                    result.reply ||
                    result.response ||
                    result.message ||
                    result.text
                );

            if (!reply) {

                throw new Error(
                    "Zono returned an empty response."
                );
            }

            addAIMessage(
                reply
            );


        } catch (error) {

            removeTyping(
                typing
            );

            console.error(
                "Zono request error:",
                error
            );

            let errorText =
                error &&
                error.message
                    ? error.message
                    : "Something went wrong.";

            /*
               Make common network errors
               easier to understand.
            */

            if (
                errorText ===
                    "Failed to fetch"
            ) {
                errorText =
                    "I couldn't connect to the Zono server. Please check your internet connection or try again.";
            }

            addAIMessage(
                "Sorry, I couldn't complete that request.\n\n" +
                errorText
            );

        } finally {

            isGenerating =
                false;

            if (sendButton) {
                sendButton.disabled =
                    false;
            }

            if (attachButton) {
                attachButton.disabled =
                    false;
            }

            if (messageInput) {
                messageInput.focus();
            }

        }
    }


    /* ==========================================
       SEND BUTTON
       ========================================== */

    if (sendButton) {

        sendButton.addEventListener(
            "click",
            sendMessage
        );

    }


    /* ==========================================
       ENTER TO SEND
       ========================================== */

    if (messageInput) {

        messageInput.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    sendMessage();

                }

            }
        );

    }


    /* ==========================================
       VOICE INPUT
       ========================================== */

    function setupVoiceRecognition() {

        if (!voiceButton) {
            return;
        }

        const Recognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (!Recognition) {

            voiceButton.title =
                "Voice input is not supported in this browser";

            return;
        }

        speechRecognition =
            new Recognition();

        speechRecognition.continuous =
            false;

        speechRecognition.interimResults =
            false;

        speechRecognition.lang =
            "en-IN";


        speechRecognition.onstart =
            function () {

                voiceButton.classList.add(
                    "recording"
                );

                voiceButton.textContent =
                    "⏹";

            };


        speechRecognition.onresult =
            function (event) {

                let transcript =
                    "";

                for (
                    let i = 0;
                    i <
                    event.results.length;
                    i++
                ) {

                    transcript +=
                        event.results[i][0]
                            .transcript;

                }

                if (messageInput) {

                    messageInput.value =
                        (
                            messageInput.value
                                ? messageInput.value +
                                  " "
                                : ""
                        ) +
                        transcript.trim();

                    messageInput.focus();

                }

            };


        speechRecognition.onerror =
            function (event) {

                console.error(
                    "Voice recognition error:",
                    event.error
                );

            };


        speechRecognition.onend =
            function () {

                voiceButton.classList.remove(
                    "recording"
                );

                voiceButton.textContent =
                    "🎙️";

            };


        voiceButton.addEventListener(
            "click",
            function () {

                if (isGenerating) {
                    return;
                }

                try {

                    speechRecognition.start();

                } catch (error) {

                    /*
                       If recognition is already
                       running, stop it.
                    */

                    try {
                        speechRecognition.stop();
                    } catch (stopError) {
                        console.error(
                            stopError
                        );
                    }

                }

            }
        );

    }


    /* ==========================================
       PAGE VISIBILITY
       ========================================== */

    document.addEventListener(
        "visibilitychange",
        function () {

            /*
               Stop speech when the user
               leaves the page.
            */

            if (
                document.hidden &&
                "speechSynthesis" in window
            ) {

                window.speechSynthesis
                    .cancel();

            }

        }
    );


    /* ==========================================
       INITIALIZE
       ========================================== */

    function initializeZono() {

        loadChats();

        ensureCurrentChat();

        renderHistory();

        renderAttachments();

        renderMessages();

        setupVoiceRecognition();

        if (messageInput) {
            messageInput.focus();
        }

        console.log(
            "Zono AI initialized successfully."
        );

    }


    /* ==========================================
       START ZONO
       ========================================== */

    initializeZono();

});