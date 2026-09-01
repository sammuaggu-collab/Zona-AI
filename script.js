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
       BASIC HELPERS
    ========================================== */

    function exists(element) {

        return element !== null &&
               element !== undefined;
    }


    function scrollBottom() {

        if (!exists(chatArea)) {
            return;
        }

        requestAnimationFrame(
            function () {

                chatArea.scrollTop =
                    chatArea.scrollHeight;
            }
        );
    }


    function escapeHTML(text) {

        const div =
            document.createElement("div");

        div.textContent =
            String(text || "");

        return div.innerHTML;
    }


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
            clean.substring(0, 32) +
            "..."
        );
    }


    /* ==========================================
       STORAGE
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


            if (
                Array.isArray(parsed)
            ) {

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

            sidebar.classList.add(
                "open"
            );
        }


        if (exists(backdrop)) {

            backdrop.classList.add(
                "show"
            );
        }
    }


    function closeSidebar() {

        if (exists(sidebar)) {

            sidebar.classList.remove(
                "open"
            );
        }


        if (exists(backdrop)) {

            backdrop.classList.remove(
                "show"
            );
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
       CHAT CREATION
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


        chats.unshift(
            chat
        );


        currentChat =
            chat;


        selectedFiles =
            [];


        saveChats();

        renderAttachments();

        showChat();

        updateHistory();

        closeSidebar();


        if (
            exists(messageInput)
        ) {

            messageInput.focus();
        }
    }


    if (
        exists(newChatButton)
    ) {

        newChatButton.addEventListener(
            "click",
            createChat
        );
    }


    /* ==========================================
       CHAT HISTORY
    ========================================== */

    function updateHistory() {

        if (
            !exists(chatHistory)
        ) {

            return;
        }


        chatHistory.innerHTML =
            "";


        chats.forEach(
            function (chat) {

                const item =
                    document.createElement(
                        "button"
                    );


                item.type =
                    "button";


                item.className =
                    "history-item";


                if (
                    currentChat &&
                    currentChat.id ===
                    chat.id
                ) {

                    item.classList.add(
                        "active"
                    );
                }


                item.textContent =
                    chat.title ||
                    "New Chat";


                item.addEventListener(
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


                chatHistory.appendChild(
                    item
                );
            }
        );
    }


    /* ==========================================
       SHOW CURRENT CHAT
    ========================================== */

    function showChat() {

        if (
            !exists(chatArea)
        ) {

            return;
        }


        chatArea.innerHTML =
            "";


        if (
            !currentChat
        ) {

            return;
        }


        currentChat.messages.forEach(
            function (message) {

                addMessage(
                    message.text,
                    message.sender ===
                        "user"
                        ? "user"
                        : "bot",
                    false,
                    message.image || null,
                    false
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


    if (
        exists(fileInput)
    ) {

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


                fileInput.value =
                    "";
            }
        );
    }


    function renderAttachments() {

        if (
            !exists(
                attachmentPreview
            )
        ) {

            return;
        }


        attachmentPreview.innerHTML =
            "";


        selectedFiles.forEach(
            function (
                file,
                index
            ) {

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


                remove.className =
                    "attachment-remove";


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


                item.appendChild(
                    icon
                );

                item.appendChild(
                    name
                );

                item.appendChild(
                    remove
                );


                attachmentPreview.appendChild(
                    item
                );
            }
        );
    }


  /* ==========================================
   ADD MESSAGE
========================================== */

function addMessage(
    text,
    sender,
    animate,
    image,
    saveToChat
) {

    if (!exists(chatArea)) {
        return null;
    }


    const wrapper =
        document.createElement("div");


    wrapper.className =
        "message-wrapper " +
        (
            sender === "user"
                ? "user-message"
                : "bot-message"
        );


    const message =
        document.createElement("div");


    message.className =
        "message";


    /* ======================================
       MESSAGE TEXT
    ====================================== */

    const textElement =
        document.createElement("div");


    textElement.className =
        "message-text";


    message.appendChild(
        textElement
    );


    wrapper.appendChild(
        message
    );


    /* ======================================
       IMAGE
    ====================================== */

    if (image && image.url) {

    const imageContainer = document.createElement("div");
    imageContainer.className = "zono-generated-image";

    const imageElement = document.createElement("img");
    imageElement.src = image.url;
    imageElement.alt = image.title || "Generated image";
    imageElement.loading = "lazy";

    imageElement.style.maxWidth = "100%";
    imageElement.style.borderRadius = "14px";
    imageElement.style.display = "block";

    imageContainer.appendChild(imageElement);

    const downloadButton = document.createElement("button");

    downloadButton.type = "button";
    downloadButton.className = "message-action";
    downloadButton.textContent = "⬇️ Download";

    downloadButton.addEventListener("click", async function () {

        try {

            const response = await fetch(image.url);
            const blob = await response.blob();

            const url =
                URL.createObjectURL(blob);

            const link =
                document.createElement("a");

            link.href = url;
            link.download = "zono-generated-image.png";

            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(url);

        } catch (error) {

            console.error(
                "Image download failed:",
                error
            );

            window.open(
                image.url,
                "_blank"
            );
        }
    });

    imageContainer.appendChild(
        downloadButton
    );

    message.appendChild(
        imageContainer
    );
    }

        const imageContainer =
            document.createElement(
                "div"
            );


        imageContainer.className =
            "zono-generated-image";


        const imageElement =
            document.createElement(
                "img"
            );


        imageElement.src =
            image.url;


        imageElement.alt =
            image.title ||
            "Generated image";


        imageElement.loading =
            "lazy";


        imageElement.style.maxWidth =
            "100%";


        imageElement.style.borderRadius =
            "14px";


        imageContainer.appendChild(
            imageElement
        );


        message.appendChild(
            imageContainer
        );
    }


    /* ======================================
       ACTION BUTTONS
    ====================================== */

    if (
        sender === "bot"
    ) {

        const actions =
            document.createElement(
                "div"
            );


        actions.className =
            "message-actions";


        const copyButton =
            document.createElement(
                "button"
            );


        copyButton.type =
            "button";


        copyButton.className =
            "message-action";


        copyButton.textContent =
            "Copy";


        copyButton.addEventListener(
            "click",
            async function () {

                try {

                    await navigator.clipboard.writeText(
                        String(text || "")
                    );


                    copyButton.textContent =
                        "Copied!";


                    setTimeout(
                        function () {

                            copyButton.textContent =
                                "Copy";

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


        const deleteButton =
            document.createElement(
                "button"
            );


        deleteButton.type =
            "button";


        deleteButton.className =
            "message-action";


        deleteButton.textContent =
            "Delete";


        deleteButton.addEventListener(
            "click",
            function () {

                wrapper.remove();


                if (
                    currentChat
                ) {

                    const index =
                        currentChat.messages.findIndex(
                            function (item) {

                                return (
                                    item.text ===
                                    text &&
                                    item.sender ===
                                    sender
                                );
                            }
                        );


                    if (
                        index !== -1
                    ) {

                        currentChat.messages.splice(
                            index,
                            1
                        );

                        saveChats();
                    }
                }
            }
        );


        actions.appendChild(
            copyButton
        );


        actions.appendChild(
            deleteButton
        );


        message.appendChild(
            actions
        );
    }


    chatArea.appendChild(
        wrapper
    );


    /* ======================================
       ANIMATED BOT RESPONSE
    ====================================== */

    if (
        sender === "bot" &&
        animate
    ) {

        typeMessage(
            textElement,
            text
        );

    } else {

        textElement.innerHTML =
            formatMessage(
                text
            );
    }


    scrollBottom();


    return wrapper;
}


/* ==========================================
   MESSAGE FORMATTING
========================================== */

function formatMessage(
    text
) {

    let value =
        String(text || "");


    value =
        escapeHTML(
            value
        );


    /* Bold */

    value =
        value.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );


    /* Italic */

    value =
        value.replace(
            /\*(.*?)\*/g,
            "<em>$1</em>"
        );


    /* Inline code */

    value =
        value.replace(
            /`([^`]+)`/g,
            "<code>$1</code>"
        );


    /* New lines */

    value =
        value.replace(
            /\n/g,
            "<br>"
        );


    return value;
}


/* ==========================================
   TYPING ANIMATION
========================================== */

function typeMessage(
    element,
    text
) {

    if (!element) {
        return;
    }


    const value =
        String(text || "");


    let index =
        0;


    element.innerHTML =
        "";


    const speed =
        value.length > 700
            ? 2
            : 8;


    function typeNext() {

        if (
            index >=
            value.length
        ) {

            element.innerHTML =
                formatMessage(
                    value
                );

            scrollBottom();

            return;
        }


        index += 1;


        element.innerHTML =
            formatMessage(
                value.substring(
                    0,
                    index
                )
            );


        scrollBottom();


        setTimeout(
            typeNext,
            speed
        );
    }


    typeNext();
}


/* ==========================================
   TYPING INDICATOR
========================================== */

function showTyping() {

    removeTyping();


    if (
        !exists(chatArea)
    ) {

        return;
    }


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.id =
        "zonoTyping";


    wrapper.className =
        "message-wrapper bot-message";


    const bubble =
        document.createElement(
            "div"
        );


    bubble.className =
        "message typing-message";


    const dots =
        document.createElement(
            "div"
        );


    dots.className =
        "typing-dots";


    dots.innerHTML =
        "<span></span>" +
        "<span></span>" +
        "<span></span>";


    bubble.appendChild(
        dots
    );


    wrapper.appendChild(
        bubble
    );


    chatArea.appendChild(
        wrapper
    );


    scrollBottom();
}


function removeTyping() {

    const typing =
        document.getElementById(
            "zonoTyping"
        );


    if (
        typing
    ) {

        typing.remove();
    }
}


/* ==========================================
   SEND MESSAGE
========================================== */

async function sendMessage() {

    if (
        waitingForAI
    ) {

        return;
    }


    const text =
        exists(messageInput)
            ? messageInput.value.trim()
            : "";


    if (
        !text &&
        selectedFiles.length === 0
    ) {

        return;
    }


    if (
        !currentChat
    ) {

        createChat();
    }


    if (
        currentChat.messages.length ===
        0
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
        false,
        null,
        true
    );


    if (
        exists(messageInput)
    ) {

        messageInput.value =
            "";
    }


    saveChats();

    updateHistory();


    const filesToSend =
        [
            ...selectedFiles
        ];


    selectedFiles =
        [];


    renderAttachments();


    waitingForAI =
        true;


    if (
        exists(sendButton)
    ) {

        sendButton.disabled =
            true;
    }


    showTyping();


    try {

        const formData =
            new FormData();


        const apiMessages =
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
            );


        formData.append(
            "messages",
            JSON.stringify(
                apiMessages
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

        } catch {

            throw new Error(
                "The server returned an invalid response."
            );
        }


        removeTyping();


        if (
            !response.ok
        ) {

            throw new Error(
                data.error ||
                "Zono AI server error."
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
                data.image ||
                null
        });


        addMessage(
            reply,
            "bot",
            true,
            data.image ||
                null,
            true
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
            true,
            null,
            true
        );


        saveChats();

    } finally {

        waitingForAI =
            false;


        if (
            exists(sendButton)
        ) {

            sendButton.disabled =
                false;
        }
    }
}


/* ==========================================
   SEND BUTTON
========================================== */

if (
    exists(sendButton)
) {

    sendButton.addEventListener(
        "click",
        sendMessage
    );
}


/* ==========================================
   ENTER TO SEND
========================================== */

if (
    exists(messageInput)
) {

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
   CLEAR CURRENT CHAT
========================================== */

function clearCurrentChat() {

    if (!currentChat) {
        createChat();
        return;
    }

    currentChat.messages = [];
    currentChat.title = "New Chat";

    selectedFiles = [];

    saveChats();
    renderAttachments();
    showChat();
    updateHistory();

    if (exists(messageInput)) {
        messageInput.focus();
    }
}


/* ==========================================
   FIND CLEAR BUTTON
========================================== */

const clearChatButton =
    document.getElementById("clearChatButton");

if (exists(clearChatButton)) {

    clearChatButton.addEventListener(
        "click",
        function () {

            clearCurrentChat();

        }
    );
}


/* ==========================================
   IMAGE GENERATION
========================================== */

async function generateImageFromPrompt(
    prompt
) {

    if (
        waitingForAI
    ) {

        return;
    }


    const cleanPrompt =
        String(prompt || "")
            .trim();


    if (!cleanPrompt) {
        return;
    }


    if (!currentChat) {
        createChat();
    }


    currentChat.messages.push({

        sender:
            "user",

        text:
            "🎨 " + cleanPrompt
    });


    addMessage(
        "🎨 " + cleanPrompt,
        "user",
        false,
        null,
        true
    );


    waitingForAI = true;


    showTyping();


    try {

        const response =
            await fetch(
                "/api/generate-image",
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
                                cleanPrompt
                        })
                }
            );


        let data;


        try {

            data =
                await response.json();

        } catch {

            throw new Error(
                "Invalid image server response."
            );
        }


        removeTyping();


        if (
            !response.ok
        ) {

            throw new Error(
                data.error ||
                "Image generation failed."
            );
        }


        if (
            !data.image ||
            !data.image.url
        ) {

            throw new Error(
                "The server did not return an image."
            );
        }


        const reply =
            "Done — here's your generated image.";


        currentChat.messages.push({

            sender:
                "bot",

            text:
                reply,

            image:
                data.image
        });


        addMessage(
            reply,
            "bot",
            true,
            data.image,
            true
        );


        saveChats();


    } catch (error) {

        removeTyping();


        console.error(
            "Image generation error:",
            error
        );


        const errorMessage =
            "Sorry, I couldn't generate that image right now.";


        currentChat.messages.push({

            sender:
                "bot",

            text:
                errorMessage
        });


        addMessage(
            errorMessage,
            "bot",
            true,
            null,
            true
        );


        saveChats();

    } finally {

        waitingForAI =
            false;
    }
}


/* ==========================================
   IMAGE COMMAND BUTTON SUPPORT
========================================== */

const imageButton =
    document.getElementById("imageButton");


if (
    exists(imageButton)
) {

    imageButton.addEventListener(
        "click",
        function () {

            if (
                exists(messageInput)
            ) {

                messageInput.focus();

                messageInput.value =
                    "Create an image of ";
            }
        }
    );
}


/* ==========================================
   VOICE INPUT
========================================== */

function setupVoiceInput() {

    if (
        !exists(voiceButton)
    ) {

        return;
    }


    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (
        !SpeechRecognition
    ) {

        voiceButton.style.display =
            "none";

        return;
    }


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
        };


    recognition.onend =
        function () {

            voiceButton.classList.remove(
                "recording"
            );
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
        };


    recognition.onresult =
        function (event) {

            const result =
                event.results[0][0]
                    .transcript;


            if (
                exists(messageInput)
            ) {

                const existing =
                    messageInput.value
                        .trim();


                messageInput.value =
                    existing
                        ? existing +
                          " " +
                          result
                        : result;


                messageInput.focus();
            }
        };


    voiceButton.addEventListener(
        "click",
        function () {

            try {

                recognition.start();

            } catch (error) {

                console.error(
                    "Voice start error:",
                    error
                );
            }
        }
    );
}


/* ==========================================
   KEYBOARD SHORTCUT
========================================== */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.ctrlKey &&
            event.key.toLowerCase() ===
                "k"
        ) {

            event.preventDefault();


            if (
                exists(messageInput)
            ) {

                messageInput.focus();
            }
        }
    }
);


/* ==========================================
   INITIALIZE
========================================== */

loadChats();


if (
    chats.length > 0
) {

    currentChat =
        chats[0];

} else {

    createChat();
}


renderAttachments();

showChat();

updateHistory();

setupVoiceInput();


/* ==========================================
   DEBUG
========================================== */

console.log(
    "================================"
);

console.log(
    "       ZONO SCRIPT LOADED"
);

console.log(
    "================================"
);

console.log(
    "Chat:",
    exists(chatArea)
);

console.log(
    "Input:",
    exists(messageInput)
);

console.log(
    "Send:",
    exists(sendButton)
);

console.log(
    "Attach:",
    exists(attachButton)
);

console.log(
    "Image generation:",
    true
);

console.log(
    "Copy:",
    true
);

console.log(
    "Delete:",
    true
);

console.log(
    "Clear:",
    true
);

console.log(
    "================================"
);

});