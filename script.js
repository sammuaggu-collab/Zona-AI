document.addEventListener("DOMContentLoaded", function () {

    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebarBackdrop");

    const menuButton = document.getElementById("menuButton");
    const closeButton = document.getElementById("closeSidebar");

    const newChatButton = document.getElementById("newChatButton");
    const topNewChat = document.getElementById("topNewChat");

    const chatArea = document.getElementById("chatArea");
    const chatHistory = document.getElementById("chatHistory");

    const messageInput = document.getElementById("messageInput");
    const sendButton = document.getElementById("sendButton");

    let chats = [];
    let currentChat = null;
    let waitingForAI = false;


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

    menuButton.addEventListener("click", openSidebar);
    closeButton.addEventListener("click", closeSidebar);
    backdrop.addEventListener("click", closeSidebar);


    /* =========================
       CHAT CREATION
    ========================= */

    function createChat() {

        const chat = {
            id: Date.now(),
            title: "New Chat",
            messages: []
        };

        chats.unshift(chat);
        currentChat = chat;

        saveChats();
        showChat();
        updateHistory();

        closeSidebar();
        messageInput.focus();
    }

    newChatButton.addEventListener("click", createChat);
    topNewChat.addEventListener("click", createChat);


    /* =========================
       SHOW CHAT
    ========================= */

    function showChat() {

        chatArea.innerHTML = "";

        if (!currentChat || currentChat.messages.length === 0) {

            chatArea.innerHTML = `
                <div class="welcome">
                    <div class="welcome-logo">Z</div>
                    <h1>Welcome to Zono AI</h1>
                    <p>Your AI. Your world.</p>
                </div>
            `;

            return;
        }

        currentChat.messages.forEach(function (message) {

            addMessage(
                message.text,
                message.sender,
                false
            );

        });

        scrollBottom();
    }


    /* =========================
       SEND MESSAGE
    ========================= */

    async function sendMessage() {

        if (waitingForAI) {
            return;
        }

        const text = messageInput.value.trim();

        if (text === "") {
            return;
        }

        if (!currentChat) {
            createChat();
        }

        if (currentChat.messages.length === 0) {
            currentChat.title = makeTitle(text);
        }

        currentChat.messages.push({
            sender: "user",
            text: text
        });

        addMessage(text, "user", true);

        messageInput.value = "";

        saveChats();
        updateHistory();

        waitingForAI = true;

        showTyping();

        try {

            const response = await fetch("/api/chat", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    messages: currentChat.messages.map(function (message) {

                        return {
                            role: message.sender === "user"
                                ? "user"
                                : "assistant",

                            content: message.text
                        };

                    })
                })

            });


            const data = await response.json();

            removeTyping();


            if (!response.ok) {

                throw new Error(
                    data.error || "Server error"
                );

            }


            const reply =
                data.reply || "I couldn't generate a response.";


            currentChat.messages.push({
                sender: "bot",
                text: reply
            });


            addMessage(
                reply,
                "bot",
                true
            );


            saveChats();

        } catch (error) {

            removeTyping();

            console.error("Zono AI error:", error);

            const errorMessage =
                "Sorry, I couldn't connect to my AI server right now.";

            currentChat.messages.push({
                sender: "bot",
                text: errorMessage
            });

            addMessage(
                errorMessage,
                "bot",
                true
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


    messageInput.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                event.preventDefault();

                sendMessage();

            }

        }
    );


    /* =========================
       MESSAGE
    ========================= */

    function addMessage(text, sender, animate) {

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


        if (sender === "bot" && animate) {

            typeText(
                bubble,
                text
            );

        } else {

            bubble.textContent =
                text;

        }


        scrollBottom();
    }


    /* =========================
       TYPE EFFECT
    ========================= */

    function typeText(element, text) {

        let index = 0;

        function write() {

            if (index >= text.length) {
                return;
            }

            element.textContent +=
                text.charAt(index);

            index++;

            scrollBottom();

            setTimeout(
                write,
                18
            );
        }

        write();
    }


    /* =========================
       THINKING DOTS
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
       CHAT NAME
    ========================= */

    function makeTitle(text) {

        let title =
            text
                .replace(/\s+/g, " ")
                .trim();


        if (title.length > 26) {

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

        chatHistory.innerHTML = "";


        chats.forEach(function (chat) {

            const card =
                document.createElement("div");

            card.className =
                "chat-card";


            if (
                currentChat &&
                chat.id === currentChat.id
            ) {

                card.classList.add("active");

            }


            card.textContent =
                "💬  " + chat.title;


            card.addEventListener(
                "click",
                function () {

                    currentChat = chat;

                    showChat();

                    updateHistory();

                    closeSidebar();

                }
            );


            chatHistory.appendChild(card);

        });

    }


    /* =========================
       STORAGE
    ========================= */

    function saveChats() {

        localStorage.setItem(
            "zonoChats",
            JSON.stringify(chats)
        );

    }


    function loadChats() {

        try {

            const saved =
                localStorage.getItem(
                    "zonoChats"
                );


            if (saved) {

                chats =
                    JSON.parse(saved);

            }

        } catch (error) {

            chats = [];

        }

    }


    /* =========================
       SCROLL
    ========================= */

    function scrollBottom() {

        setTimeout(function () {

            chatArea.scrollTop =
                chatArea.scrollHeight;

        }, 20);

    }


    /* =========================
       START
    ========================= */

    loadChats();


    if (chats.length === 0) {

        createChat();

    } else {

        currentChat =
            chats[0];

        showChat();

        updateHistory();

    }

});