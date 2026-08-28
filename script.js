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
    }


    newChatButton.addEventListener("click", createChat);
    topNewChat.addEventListener("click", createChat);


    /* =========================
       SHOW CHAT
    ========================= */

    function showChat() {

        chatArea.innerHTML = "";

        if (currentChat.messages.length === 0) {

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

    function sendMessage() {

        const text = messageInput.value.trim();

        if (text === "") {
            return;
        }


        /* Automatic name */

        if (currentChat.messages.length === 0) {

            currentChat.title =
                makeTitle(text);

        }


        currentChat.messages.push({
            sender: "user",
            text: text
        });


        addMessage(text, "user", true);

        messageInput.value = "";

        saveChats();
        updateHistory();


        /* Zono thinking */

        showTyping();


        setTimeout(function () {

            removeTyping();


            const reply =
                "Hey! 👋 I'm Zono AI. My AI brain still needs to be connected, but your chat system is working!";

            currentChat.messages.push({
                sender: "bot",
                text: reply
            });


            addMessage(reply, "bot", true);

            saveChats();

        }, 1200);
    }


    sendButton.addEventListener("click", sendMessage);


    messageInput.addEventListener("keydown", function (event) {

        if (event.key === "Enter") {

            event.preventDefault();

            sendMessage();

        }

    });


    /* =========================
       MESSAGE
    ========================= */

    function addMessage(text, sender, animate) {

        const message = document.createElement("div");

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

            typeText(bubble, text);

        } else {

            bubble.textContent = text;

        }


        scrollBottom();
    }


    /* =========================
       TYPING
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

            setTimeout(write, 18);
        }


        write();
    }


    /* =========================
       THINKING DOTS
    ========================= */

    function showTyping() {

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
            text.replace(/\s+/g, " ").trim();


        if (title.length > 26) {

            title =
                title.substring(0, 26) + "...";

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


            if (chat.id === currentChat.id) {

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

        currentChat = chats[0];

        showChat();

        updateHistory();

    }

});

/* =========================
   ZONO AI - ACODE KEYBOARD FIX
========================= */

(function () {

    const app = document.querySelector(".app");
    const composer = document.querySelector(".composer");

    if (!app || !composer) return;

    function fixKeyboard() {

        if (!window.visualViewport) return;

        const viewport = window.visualViewport;

        const height = viewport.height;

        app.style.height = height + "px";
        app.style.minHeight = height + "px";

        composer.style.transform = "translateY(0)";

    }

    if (window.visualViewport) {

        window.visualViewport.addEventListener(
            "resize",
            fixKeyboard
        );

        window.visualViewport.addEventListener(
            "scroll",
            fixKeyboard
        );
    }

    window.addEventListener(
        "resize",
        fixKeyboard
    );

    fixKeyboard();


})();