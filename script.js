document.addEventListener("DOMContentLoaded", () => {

    /* ==========================================
       ZONO AI - COMPLETE FRONTEND
       PART 1 / 3
    ========================================== */

    "use strict";


    /* ==========================================
       ELEMENTS
    ========================================== */

    const sidebar =
        document.getElementById("sidebar");

    const sidebarBackdrop =
        document.getElementById("sidebarBackdrop");

    const menuButton =
        document.getElementById("menuButton");

    const closeSidebar =
        document.getElementById("closeSidebar");

    const newChatButton =
        document.getElementById("newChatButton");

    const clearChatButton =
        document.getElementById("clearChatButton");

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

    const imageButton =
        document.getElementById("imageButton");


    /* ==========================================
       STATE
    ========================================== */

    let chats = [];

    let currentChat = null;

    let selectedFiles = [];

    let waitingForAI = false;

    let recognition = null;


    /* ==========================================
       SERVER URL
    ========================================== */

    /*
       Using the same server that serves the website
       prevents CORS and wrong-endpoint problems.
    */

    const API_BASE = "";


    /* ==========================================
       SAFE ELEMENT CHECK
    ========================================== */

    function exists(element) {

        return (
            element !== null &&
            element !== undefined
        );
    }


    /* ==========================================
       HTML ESCAPE
    ========================================== */

    function escapeHTML(value) {

        const div =
            document.createElement("div");

        div.textContent =
            String(value ?? "");

        return div.innerHTML;
    }


    /* ==========================================
       MESSAGE FORMATTER
    ========================================== */

    function formatMessage(text) {

        let value =
            String(text ?? "");


        value =
            escapeHTML(value);


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


        /*
           Line breaks
        */

        value =
            value.replace(
                /\n/g,
                "<br>"
            );


        return value;
    }


    /* ==========================================
       SCROLL CHAT
    ========================================== */

    function scrollToBottom() {

        if (!exists(chatArea)) {
            return;
        }


        requestAnimationFrame(() => {

            chatArea.scrollTop =
                chatArea.scrollHeight;

        });
    }


    /* ==========================================
       CHAT TITLE
    ========================================== */

    function createChatTitle(text) {

        const clean =
            String(text ?? "")
                .replace(/\s+/g, " ")
                .trim();


        if (!clean) {
            return "New Chat";
        }


        if (clean.length <= 35) {
            return clean;
        }


        return (
            clean.substring(0, 35) +
            "..."
        );
    }


    /* ==========================================
       STORAGE
    ========================================== */

    function saveChats() {

        try {

            localStorage.setItem(
                "zono_ai_chats",
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
                    "zono_ai_chats"
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
                "Zono history error:",
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


        if (
            exists(sidebarBackdrop)
        ) {

            sidebarBackdrop.classList.add(
                "show"
            );
        }
    }


    function closeSideMenu() {

        if (exists(sidebar)) {

            sidebar.classList.remove(
                "open"
            );
        }


        if (
            exists(sidebarBackdrop)
        ) {

            sidebarBackdrop.classList.remove(
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


    if (exists(closeSidebar)) {

        closeSidebar.addEventListener(
            "click",
            closeSideMenu
        );
    }


    if (
        exists(sidebarBackdrop)
    ) {

        sidebarBackdrop.addEventListener(
            "click",
            closeSideMenu
        );
    }


    /* ==========================================
       NEW CHAT
    ========================================== */

    function startNewChat() {

        const chat = {

            id:
                Date.now().toString(),

            title:
                "New Chat",

            messages:
                []
        };


        chats.unshift(chat);

        currentChat =
            chat;


        selectedFiles = [];

        renderAttachmentPreview();

        renderChat();

        renderHistory();

        saveChats();

        closeSideMenu();


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
            startNewChat
        );
    }


    /* ==========================================
       CHAT HISTORY
    ========================================== */

    function renderHistory() {

        if (
            !exists(chatHistory)
        ) {

            return;
        }


        chatHistory.innerHTML =
            "";


        chats.forEach(
            (chat) => {

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
                    () => {

                        currentChat =
                            chat;

                        selectedFiles =
                            [];

                        renderAttachmentPreview();

                        renderChat();

                        renderHistory();

                        closeSideMenu();

                    }
                );


                chatHistory.appendChild(
                    item
                );

            }
        );
    }


    /* ==========================================
       RENDER CURRENT CHAT
    ========================================== */

    function renderChat() {

        if (!exists(chatArea)) {
            return;
        }


        chatArea.innerHTML =
            "";


        if (
            !currentChat ||
            !Array.isArray(
                currentChat.messages
            )
        ) {

            showWelcome();

            return;
        }


        if (
            currentChat.messages.length ===
            0
        ) {

            showWelcome();

            return;
        }


        currentChat.messages.forEach(
            (message) => {

                addMessage(
                    message.text,
                    message.sender,
                    false,
                    message.image || null,
                    false
                );

            }
        );


        scrollToBottom();
    }


    /* ==========================================
       WELCOME SCREEN
    ========================================== */

    function showWelcome() {

        if (!exists(chatArea)) {
            return;
        }


        chatArea.innerHTML = `

            <div class="welcome" id="welcome">

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
       ADD MESSAGE
    ========================================== */

    function addMessage(
        text,
        sender = "bot",
        animate = true,
        image = null,
        save = true
    ) {

        if (!exists(chatArea)) {
            return null;
        }


        /*
           Remove welcome screen
        */

        const welcome =
            document.getElementById("welcome");

        if (welcome) {
            welcome.remove();
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


        const bubble =
            document.createElement("div");


        bubble.className =
            "message";


        const textElement =
            document.createElement("div");


        textElement.className =
            "message-text";


        bubble.appendChild(
            textElement
        );


        /*
           Generated image
        */

        if (
            image &&
            image.url
        ) {

            const imageContainer =
                document.createElement("div");


            imageContainer.className =
                "zono-generated-image";


            const generatedImage =
                document.createElement("img");


            generatedImage.src =
                image.url;


            generatedImage.alt =
                image.title ||
                "Zono generated image";


            generatedImage.loading =
                "lazy";


            imageContainer.appendChild(
                generatedImage
            );


            /*
               Image actions
            */

            const imageActions =
                document.createElement("div");


            imageActions.className =
                "message-actions";


            /*
               DOWNLOAD
            */

            const downloadButton =
                document.createElement("button");


            downloadButton.type =
                "button";


            downloadButton.className =
                "message-action";


            downloadButton.textContent =
                "⬇️ Download";


            downloadButton.addEventListener(
                "click",
                async () => {

                    try {

                        const response =
                            await fetch(
                                image.url
                            );


                        if (
                            !response.ok
                        ) {

                            throw new Error(
                                "Download failed"
                            );
                        }


                        const blob =
                            await response.blob();


                        const blobURL =
                            URL.createObjectURL(
                                blob
                            );


                        const link =
                            document.createElement(
                                "a"
                            );


                        link.href =
                            blobURL;


                        link.download =
                            "zono-generated-image.png";


                        document.body.appendChild(
                            link
                        );


                        link.click();


                        link.remove();


                        setTimeout(
                            () => {

                                URL.revokeObjectURL(
                                    blobURL
                                );

                            },
                            1000
                        );


                    } catch (error) {

                        console.error(
                            "Image download error:",
                            error
                        );


                        window.open(
                            image.url,
                            "_blank"
                        );

                    }

                }
            );


            imageActions.appendChild(
                downloadButton
            );


            imageContainer.appendChild(
                imageActions
            );


            bubble.appendChild(
                imageContainer
            );

        }


        /*
           Normal text
        */

        if (
            text &&
            String(text).trim()
        ) {

            if (
                animate &&
                sender === "bot"
            ) {

                typeMessage(
                    textElement,
                    text
                );

            } else {

                textElement.innerHTML =
                    formatMessage(text);

            }

        }


        /*
           Bot action buttons
        */

        if (
            sender === "bot"
        ) {

            const actions =
                document.createElement(
                    "div"
                );


            actions.className =
                "message-actions";


            /*
               COPY BUTTON
            */

            const copyButton =
                document.createElement(
                    "button"
                );


            copyButton.type =
                "button";


            copyButton.className =
                "message-action";


            copyButton.textContent =
                "📋 Copy";


            copyButton.addEventListener(
                "click",
                async () => {

                    try {

                        await navigator.clipboard.writeText(
                            String(text || "")
                        );


                        copyButton.textContent =
                            "✓ Copied";


                        setTimeout(
                            () => {

                                copyButton.textContent =
                                    "📋 Copy";

                            },
                            1500
                        );


                    } catch (error) {

                        console.error(
                            "Copy error:",
                            error
                        );


                        /*
                           Fallback copy
                        */

                        try {

                            const area =
                                document.createElement(
                                    "textarea"
                                );


                            area.value =
                                String(text || "");


                            document.body.appendChild(
                                area
                            );


                            area.select();


                            document.execCommand(
                                "copy"
                            );


                            area.remove();


                            copyButton.textContent =
                                "✓ Copied";


                            setTimeout(
                                () => {

                                    copyButton.textContent =
                                        "📋 Copy";

                                },
                                1500
                            );

                        } catch (
                            fallbackError
                        ) {

                            console.error(
                                "Fallback copy error:",
                                fallbackError
                            );

                        }

                    }

                }
            );


            /*
               DELETE BUTTON
            */

            const deleteButton =
                document.createElement(
                    "button"
                );


            deleteButton.type =
                "button";


            deleteButton.className =
                "message-action";


            deleteButton.textContent =
                "🗑️ Delete";


            deleteButton.addEventListener(
                "click",
                () => {

                    if (
                        !currentChat
                    ) {

                        return;
                    }


                    /*
                       Find this message
                       using the text and
                       remove the matching
                       message from history.
                    */

                    const index =
                        currentChat.messages.findIndex(
                            message =>
                                message.text ===
                                text
                        );


                    if (
                        index !== -1
                    ) {

                        currentChat.messages.splice(
                            index,
                            1
                        );

                    }


                    wrapper.remove();

                    saveChats();

                }
            );


            actions.appendChild(
                copyButton
            );


            actions.appendChild(
                deleteButton
            );


            bubble.appendChild(
                actions
            );

        }


        wrapper.appendChild(
            bubble
        );


        chatArea.appendChild(
            wrapper
        );


        scrollToBottom();


        /*
           Save message to current chat
        */

        if (
            save &&
            currentChat
        ) {

            currentChat.messages.push({

                sender:
                    sender,

                text:
                    String(text || ""),

                image:
                    image || null

            });


            saveChats();

            renderHistory();

        }


        return wrapper;
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


        let index = 0;


        element.innerHTML =
            "";


        /*
           Faster animation for
           long AI responses.
        */

        const speed =
            value.length > 1000
                ? 1
                : 8;


        function typeNext() {

            if (
                index >=
                value.length
            ) {

                element.innerHTML =
                    formatMessage(value);

                scrollToBottom();

                return;
            }


            index++;


            element.innerHTML =
                formatMessage(
                    value.substring(
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
       TYPING INDICATOR
    ========================================== */

    function showTyping() {

        removeTyping();


        if (!exists(chatArea)) {
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


        bubble.innerHTML = `

            <div class="typing-dots">

                <span></span>

                <span></span>

                <span></span>

            </div>

        `;


        wrapper.appendChild(
            bubble
        );


        chatArea.appendChild(
            wrapper
        );


        scrollToBottom();
    }


    function removeTyping() {

        const typing =
            document.getElementById(
                "zonoTyping"
            );


        if (typing) {

            typing.remove();

        }
    }


    /* ==========================================
       ATTACHMENT PREVIEW
    ========================================== */

    function renderAttachmentPreview() {

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
            (file, index) => {

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


                const removeButton =
                    document.createElement(
                        "button"
                    );


                removeButton.type =
                    "button";


                removeButton.className =
                    "attachment-remove";


                removeButton.textContent =
                    "×";


                removeButton.addEventListener(
                    "click",
                    () => {

                        selectedFiles.splice(
                            index,
                            1
                        );


                        renderAttachmentPreview();

                    }
                );


                item.appendChild(
                    name
                );


                item.appendChild(
                    removeButton
                );


                attachmentPreview.appendChild(
                    item
                );

            }
        );
    }


    /* ==========================================
       FILE INPUT
    ========================================== */

    if (
        exists(attachButton) &&
        exists(fileInput)
    ) {

        attachButton.addEventListener(
            "click",
            () => {

                fileInput.click();

            }
        );

    }


    if (exists(fileInput)) {

        fileInput.addEventListener(
            "change",
            () => {

                const files =
                    Array.from(
                        fileInput.files || []
                    );


                /*
                   Maximum 5 files
                */

                selectedFiles.push(
                    ...files
                );


                selectedFiles =
                    selectedFiles.slice(
                        0,
                        5
                    );


                renderAttachmentPreview();


                /*
                   Allow selecting the
                   same file again later.
                */

                fileInput.value =
                    "";

            }
        );

    }


    /* ==========================================
       CLEAR CHAT
    ========================================== */

    function clearCurrentChat() {

        if (!currentChat) {
            return;
        }


        currentChat.messages =
            [];


        currentChat.title =
            "New Chat";


        selectedFiles =
            [];


        renderAttachmentPreview();

        renderChat();

        renderHistory();

        saveChats();


        if (
            exists(messageInput)
        ) {

            messageInput.value =
                "";

            messageInput.focus();

        }

    }


    if (
        exists(clearChatButton)
    ) {

        clearChatButton.addEventListener(
            "click",
            clearCurrentChat
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


        /*
           Don't send completely empty messages
           unless files are attached.
        */

        if (
            !text &&
            selectedFiles.length === 0
        ) {

            return;
        }


        /*
           Make sure a chat exists.
        */

        if (!currentChat) {

            const chat = {

                id:
                    Date.now().toString(),

                title:
                    "New Chat",

                messages:
                    []
            };


            chats.unshift(chat);

            currentChat =
                chat;
        }


        /*
           Set chat title from first message.
        */

        if (
            currentChat.messages.length ===
            0
        ) {

            currentChat.title =
                createChatTitle(
                    text ||
                    selectedFiles[0]?.name ||
                    "New Chat"
                );
        }


        /*
           Save files before clearing them.
        */

        const files =
            [...selectedFiles];


        selectedFiles =
            [];


        renderAttachmentPreview();


        /*
           Add user message.
        */

        const userText =
            text ||
            "Please analyze the attached file.";


        currentChat.messages.push({

            sender:
                "user",

            text:
                userText,

            image:
                null

        });


        addMessage(
            userText,
            "user",
            false,
            null,
            false
        );


        if (
            exists(messageInput)
        ) {

            messageInput.value =
                "";

        }


        saveChats();

        renderHistory();


        /*
           Lock controls while
           waiting for AI.
        */

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


            /*
               Send the conversation
               to the backend.
            */

            const conversation =
                currentChat.messages.map(
                    message => ({

                        role:
                            message.sender ===
                            "user"
                                ? "user"
                                : "assistant",

                        content:
                            message.text

                    })
                );


            formData.append(
                "messages",
                JSON.stringify(
                    conversation
                )
            );


            /*
               Add attachments.
            */

            files.forEach(
                file => {

                    formData.append(
                        "files",
                        file
                    );

                }
            );


            const response =
                await fetch(
                    API_BASE +
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
                    "Zono server returned invalid data."
                );

            }


            removeTyping();


            if (
                !response.ok
            ) {

                throw new Error(
                    data.error ||
                    data.message ||
                    "Zono AI request failed."
                );

            }


            /*
               Support several possible
               backend response names.
            */

            const reply =
                data.reply ||
                data.text ||
                data.message ||
                data.response ||
                "I couldn't generate a response.";


            /*
               Save AI response.
            */

            currentChat.messages.push({

                sender:
                    "bot",

                text:
                    reply,

                image:
                    data.image ||
                    null

            });


            /*
               Display AI response.
            */

            addMessage(
                reply,
                "bot",
                true,
                data.image ||
                    null,
                false
            );


            saveChats();


        } catch (error) {

            removeTyping();


            console.error(
                "Zono AI error:",
                error
            );


            const errorMessage =
                "⚠️ Zono AI error: " +
                (
                    error.message ||
                    "Unable to connect to the AI server."
                );


            currentChat.messages.push({

                sender:
                    "bot",

                text:
                    errorMessage,

                image:
                    null

            });


            addMessage(
                errorMessage,
                "bot",
                true,
                null,
                false
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


            if (
                exists(messageInput)
            ) {

                messageInput.focus();

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
            event => {

                if (
                    event.key ===
                    "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    sendMessage();

                }

            }
        );

    }


    /* ==========================================
       IMAGE GENERATOR
    ========================================== */

    async function generateImage() {

        if (waitingForAI) {
            return;
        }


        let prompt = "";


        /*
           Use the message box first.
        */

        if (
            exists(messageInput)
        ) {

            prompt =
                messageInput.value.trim();

        }


        /*
           If empty, ask for prompt.
        */

        if (!prompt) {

            prompt =
                window.prompt(
                    "What should Zono AI generate?"
                ) || "";

        }


        prompt =
            prompt.trim();


        if (!prompt) {
            return;
        }


        /*
           Make sure chat exists.
        */

        if (!currentChat) {

            const chat = {

                id:
                    Date.now().toString(),

                title:
                    createChatTitle(prompt),

                messages:
                    []

            };


            chats.unshift(chat);

            currentChat =
                chat;

        }


        if (
            currentChat.messages.length ===
            0
        ) {

            currentChat.title =
                createChatTitle(
                    prompt
                );

        }


        /*
           Add prompt to chat.
        */

        currentChat.messages.push({

            sender:
                "user",

            text:
                "🎨 " + prompt,

            image:
                null

        });


        addMessage(
            "🎨 " + prompt,
            "user",
            false,
            null,
            false
        );


        if (
            exists(messageInput)
        ) {

            messageInput.value =
                "";

        }


        saveChats();

        renderHistory();


        waitingForAI =
            true;


        showTyping();


        try {

            const response =
                await fetch(
                    API_BASE +
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
                                    prompt

                            })

                    }
                );


            let data;


            try {

                data =
                    await response.json();

            } catch {

                throw new Error(
                    "Image server returned invalid data."
                );

            }


            removeTyping();


            if (
                !response.ok
            ) {

                throw new Error(
                    data.error ||
                    data.message ||
                    "Image generation failed."
                );

            }


            /*
               Accept several backend
               image response formats.
            */

            let image =
                data.image ||
                null;


            if (
                typeof image ===
                "string"
            ) {

                image = {

                    url:
                        image

                };

            }


            if (
                !image ||
                !image.url
            ) {

                /*
                   Some backends return
                   data.url directly.
                */

                if (
                    data.url
                ) {

                    image = {

                        url:
                            data.url

                    };

                } else {

                    throw new Error(
                        "The server did not return an image."
                    );

                }

            }


            const reply =
                "Done — here's your generated image.";


            /*
               Save generated image.
            */

            currentChat.messages.push({

                sender:
                    "bot",

                text:
                    reply,

                image:
                    image

            });


            /*
               Display image + download button.
            */

            addMessage(
                reply,
                "bot",
                true,
                image,
                false
            );


            saveChats();


        } catch (error) {

            removeTyping();


            console.error(
                "Zono image generation error:",
                error
            );


            const errorMessage =
                "⚠️ Image generation error: " +
                (
                    error.message ||
                    "Unable to generate image."
                );


            currentChat.messages.push({

                sender:
                    "bot",

                text:
                    errorMessage,

                image:
                    null

            });


            addMessage(
                errorMessage,
                "bot",
                true,
                null,
                false
            );


            saveChats();

        } finally {

            waitingForAI =
                false;

        }

    }


    /* ==========================================
       IMAGE BUTTON
    ========================================== */

    if (
        exists(imageButton)
    ) {

        imageButton.addEventListener(
            "click",
            generateImage
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


        if (!SpeechRecognition) {

            voiceButton.disabled =
                true;


            voiceButton.title =
                "Voice input is not supported by this browser.";


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
            () => {

                voiceButton.classList.add(
                    "recording"
                );


                voiceButton.title =
                    "Listening...";

            };


        recognition.onend =
            () => {

                voiceButton.classList.remove(
                    "recording"
                );


                voiceButton.title =
                    "Voice input";

            };


        recognition.onerror =
            event => {

                console.error(
                    "Voice recognition error:",
                    event
                );


                voiceButton.classList.remove(
                    "recording"
                );

            };


        recognition.onresult =
            event => {

                const transcript =
                    event.results[0][0]
                        .transcript;


                if (
                    !exists(messageInput)
                ) {

                    return;
                }


                const oldText =
                    messageInput.value.trim();


                messageInput.value =
                    oldText
                        ? oldText +
                          " " +
                          transcript
                        : transcript;


                messageInput.focus();

            };


        voiceButton.addEventListener(
            "click",
            () => {

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
       INITIALIZE
    ========================================== */

    loadChats();


    /*
       Create first chat if necessary.
    */

    if (
        chats.length ===
        0
    ) {

        const firstChat = {

            id:
                Date.now().toString(),

            title:
                "New Chat",

            messages:
                []

        };


        chats.push(
            firstChat
        );


        currentChat =
            firstChat;


        saveChats();

    } else {

        currentChat =
            chats[0];

    }


    /*
       Render everything.
    */

    renderHistory();

    renderAttachmentPreview();

    renderChat();

    setupVoiceInput();


    /*
       Final startup message.
    */

    console.log(
        "Zono AI frontend loaded successfully."
    );

});