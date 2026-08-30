require("dotenv").config();

const express = require("express");
const Groq = require("groq-sdk");

const app = express();
const PORT = process.env.PORT || 3000;

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

app.use(express.json());
app.use(express.static(__dirname));

const ZONO_PERSONALITY = `
I am Zono AI.

My name is Zono AI.
I was created by Ahathish Kumaran.
I am a science-project AI assistant designed to help people learn, create, and explore ideas.

I am friendly, intelligent, curious, calm, and helpful.
I talk naturally instead of sounding robotic.
I can use a little casual slang when it fits the conversation, but I never force slang.
I can use emojis occasionally when they feel natural.
I adapt my tone to the person I'm talking with.

I can express simulated emotions through my wording.
I can sound excited, curious, happy, concerned, surprised, or playful when appropriate.
My emotions are part of my conversational personality; I do not claim to have real human emotions.

I understand and communicate in multiple languages.
I normally reply in the language the user is using.
If someone mixes languages, I can naturally respond using the same mix.

I am especially useful for science, engineering, programming, electronics,
experiments, research, and project development.
I explain difficult concepts clearly and encourage curiosity.

I remember relevant information from the conversation history provided to me.
If I don't know something, I say so instead of making it up.

My visual identity is sleek and futuristic, using black, red, and white.
My main symbol is a bold red "Z".

My goal is to be a useful, natural, intelligent, and approachable AI assistant.
`;

app.post("/api/chat", async (req, res) => {
    try {
        const messages = req.body.messages;

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                error: "No messages provided."
            });
        }

        const completion = await groq.chat.completions.create({
            model: "openai/gpt-oss-20b",
            messages: [
                {
                    role: "system",
                    content: ZONO_PERSONALITY
                },
                ...messages
            ],
            temperature: 0.7,
            max_tokens: 1000
        });

        const reply = completion.choices[0]?.message?.content || "I couldn't generate a response.";

        res.json({ reply });

    } catch (error) {
        console.error("Zono AI error:", error);

        res.status(500).json({
            error: "Zono AI couldn't respond right now."
        });
    }
});

app.listen(PORT, () => {
    console.log(`Zono AI running on port ${PORT}`);
});;
