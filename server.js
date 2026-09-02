// ============================================================
// ZONO AI — SERVER.JS
// PART 1
// ============================================================

require("dotenv").config();

const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const path = require("path");

const {
  getMayiladuthuraiKnowledgeText
} = require("./local-knowledge");

const app = express();

const PORT = process.env.PORT || 10000;

// ============================================================
// API KEYS
// ============================================================

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ============================================================
// MODELS
// ============================================================

const GROQ_TEXT_MODEL =
  process.env.GROQ_TEXT_MODEL || "openai/gpt-oss-20b";

const GROQ_VISION_MODEL =
  process.env.GROQ_VISION_MODEL || "qwen/qwen3.6-27b";

const OPENAI_IMAGE_MODEL =
  process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";

// ============================================================
// STARTUP LOG
// ============================================================

console.log("==========================================");
console.log("ZONO AI SERVER");
console.log("==========================================");
console.log("PORT:", PORT);
console.log("Groq text model:", GROQ_TEXT_MODEL);
console.log("Groq vision model:", GROQ_VISION_MODEL);
console.log("OpenAI image model:", OPENAI_IMAGE_MODEL);
console.log(
  "Groq API key:",
  GROQ_API_KEY ? "configured" : "missing"
);
console.log(
  "OpenAI API key:",
  OPENAI_API_KEY ? "configured" : "missing"
);
console.log(
  "Mayiladuthurai knowledge:",
  "loaded"
);
console.log("==========================================");

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(
  express.json({
    limit: "25mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "25mb"
  })
);

// Serve frontend files
app.use(express.static(__dirname));

// ============================================================
// FILE UPLOAD CONFIG
// ============================================================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 5
  }
});

// ============================================================
// ZONO PERSONALITY
// ============================================================

const ZONO_PERSONALITY = `
You are Zono AI, a helpful general-purpose AI assistant.

CREATOR:
Ahathish Kumaran

PERSONALITY:
- Be intelligent, calm, friendly, and helpful.
- Behave like a normal modern AI assistant.
- Do not constantly mention that you are an AI.
- Do not use excessive slang.
- Do not make up facts.
- If you are unsure, clearly say that you are unsure.
- Help students with school subjects, science projects,
  coding, research, mathematics, writing, and learning.
- Explain difficult topics simply when appropriate.
- Give short answers for simple questions.
- Give detailed answers when the user asks for detail.

LANGUAGE RULES:
- English input = English response.
- Tamil input = Tamil response.
- Tanglish input = Tanglish response.
- Mixed-language input = naturally match the mix.
- Do not automatically translate the user's question.
- Do not automatically answer English questions in Tamil.
- Only change language when the user asks.
`;

// ============================================================
// LOCAL KNOWLEDGE
// ============================================================

const LOCAL_KNOWLEDGE = `
ZONO LOCAL KNOWLEDGE:

Zono has a local-knowledge database for
Mayiladuthurai district and nearby areas.

This includes information about:
- Mayiladuthurai
- Sirkali / Sirkazhi
- Kuthalam
- Tharangambadi
- Manalmedu
- Vaitheeswarankoil
- Local schools
- Colleges
- Temples
- Tourist places
- Public places
- Other known local information

IMPORTANT:
- Never invent local information.
- Do not invent addresses.
- Do not invent phone numbers.
- Do not invent school principals or officials.
- Do not invent business information.
- Local information can change.
`;

// ============================================================
// CURRENT FACTS
// ============================================================

const CURRENT_FACTS = `
CURRENT STATIC FACTS:

Tamil Nadu Chief Minister:
C. Joseph Vijay

He became Chief Minister on 10 May 2026.

IMPORTANT:
Static facts can become outdated.
For current/latest questions, use live information when available.
`;

// ============================================================
// DETAILED ANSWER DETECTION
// ============================================================

function wantsDetailedAnswer(message = "") {
  const text = String(message).toLowerCase();

  const detailedWords = [
    "explain in detail",
    "detailed",
    "full explanation",
    "long answer",
    "step by step",
    "steps",
    "elaborate",
    "deep explanation",
    "everything",
    "complete explanation",
    "more details",
    "tell me more"
  ];

  return detailedWords.some(
    word => text.includes(word)
  );
}


// ============================================================
// SYSTEM MESSAGE
// ============================================================

function buildSystemMessage(userMessage = "") {
  const detailed = wantsDetailedAnswer(userMessage);

  return `
${ZONO_PERSONALITY}

${LOCAL_KNOWLEDGE}

${getMayiladuthuraiKnowledgeText()}

${CURRENT_FACTS}

ANSWERING RULES:
- Answer the user's actual question directly.
- Be accurate and helpful.
- Do not make up facts.
- If you are unsure about a fact, say that you are unsure.
- Keep normal answers concise.
- Give detailed explanations when the user asks for detail,
  steps, examples, or a long explanation.
- Help students with school subjects, science projects,
  coding, research, and learning.
- Recognize English, Tamil, Tanglish, and mixed-language messages.
- Reply in the language/style the user uses unless they ask
  for another language.
- Do not automatically translate the user's question.
- Do not automatically answer English questions in Tamil.
- When discussing Mayiladuthurai district, use the local
  knowledge provided above.
- Do not invent streets, schools, temples, businesses,
  addresses, opening hours, phone numbers, or other local information.
- Local businesses, schedules, officials, and other changing
  information may become outdated.
- If live internet information is available and the user asks
  for current/latest information, prefer current information.

${detailed ? `
DETAILED ANSWER MODE:
The user is asking for a detailed answer.
Explain clearly with useful details, examples, and steps.
` : `
SHORT ANSWER MODE:
Keep the answer reasonably short and focused.
`}
`;
}

// ============================================================
// MESSAGE NORMALIZATION
// ============================================================

function normalizeMessages(history = [], userMessage = "") {
  const safeHistory = Array.isArray(history)
    ? history.slice(-8)
    : [];

  const messages = [];

  for (const item of safeHistory) {
    if (!item || !item.role || !item.content) {
      continue;
    }

    const role =
      item.role === "assistant"
        ? "assistant"
        : item.role === "user"
          ? "user"
          : null;

    if (!role) continue;

    let content = String(item.content);

    if (content.length > 6000) {
      content = content.slice(0, 6000);
    }

    messages.push({
      role,
      content
    });
  }

  messages.push({
    role: "user",
    content: String(userMessage).slice(0, 6000)
  });

  return messages;
}

// ============================================================
// GROQ TEXT CHAT
// ============================================================

async function groqChat(messages, systemMessage) {
  if (!GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY is not configured."
    );
  }

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`
      },

      body: JSON.stringify({
        model: GROQ_TEXT_MODEL,

        messages: [
          {
            role: "system",
            content: systemMessage
          },
          ...messages
        ],

        temperature: 0.5,

        // Lower limit helps reduce TPM/rate-limit problems.
        max_tokens: 1024
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Groq error:", data);

    const errorMessage =
      data?.error?.message ||
      `Groq request failed with status ${response.status}`;

    throw new Error(errorMessage);
  }

  return (
    data?.choices?.[0]?.message?.content ||
    "I couldn't generate a response."
  );
}

// ============================================================
// DOCUMENT TEXT EXTRACTION
// ============================================================

async function extractDocumentText(file) {
  if (!file || !file.buffer) {
    return "";
  }

  const name = String(
    file.originalname || ""
  ).toLowerCase();

  try {
    // PDF
    if (
      file.mimetype === "application/pdf" ||
      name.endsWith(".pdf")
    ) {
      const result = await pdfParse(file.buffer);

      return result.text || "";
    }

    // DOCX
    if (
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      name.endsWith(".docx")
    ) {
      const result =
        await mammoth.extractRawText({
          buffer: file.buffer
        });

      return result.value || "";
    }

    // DOC
    if (
      file.mimetype === "application/msword" ||
      name.endsWith(".doc")
    ) {
      return file.buffer.toString("utf8");
    }

    // TXT
    if (
      file.mimetype.startsWith("text/") ||
      name.endsWith(".txt")
    ) {
      return file.buffer.toString("utf8");
    }

    return "";
  } catch (error) {
    console.error(
      `Document extraction failed for ${file.originalname}:`,
      error.message
    );

    return "";
  }
}

// ============================================================
// DOCUMENT CONTEXT
// ============================================================

async function buildDocumentContext(files = []) {
  if (
    !Array.isArray(files) ||
    files.length === 0
  ) {
    return "";
  }

  const documents = [];

  for (const file of files.slice(0, 5)) {
    const text =
      await extractDocumentText(file);

    if (!text.trim()) {
      continue;
    }

    documents.push(
      `DOCUMENT: ${file.originalname}\n${text.slice(0, 8000)}`
    );
  }

  if (documents.length === 0) {
    return "";
  }

  return `
USER ATTACHED DOCUMENTS:

${documents.join(
  "\n\n--------------------\n\n"
)}

Use these documents when answering the user's question.
Do not invent information that is not present in them.
`;
}

// ============================================================
// BASE64 FILE SUPPORT
// ============================================================

function convertBase64Files(files = []) {
  if (!Array.isArray(files)) {
    return [];
  }

  const converted = [];

  for (const file of files.slice(0, 5)) {
    if (!file || !file.data) {
      continue;
    }

    try {
      const data = String(file.data);

      let base64 = data;

      if (data.includes(",")) {
        base64 = data.split(",")[1];
      }

      converted.push({
        originalname:
          file.name || "uploaded-file",

        mimetype:
          file.type || "application/octet-stream",

        buffer:
          Buffer.from(base64, "base64")
      });
    } catch (error) {
      console.error(
        "Base64 file conversion failed:",
        error.message
      );
    }
  }

  return converted;
}

// ============================================================
// IMAGE PARTS
// ============================================================

function getImageParts(files = []) {
  if (!Array.isArray(files)) {
    return [];
  }

  const imageParts = [];

  for (const file of files.slice(0, 5)) {
    if (!file || !file.buffer) {
      continue;
    }

    const mime = String(
      file.mimetype || ""
    );

    if (!mime.startsWith("image/")) {
      continue;
    }

    const base64 =
      file.buffer.toString("base64");

    imageParts.push({
      type: "image_url",

      image_url: {
        url: `data:${mime};base64,${base64}`
      }
    });
  }

  return imageParts;
}

// ============================================================
// GROQ VISION
// ============================================================

async function groqVision(
  userMessage,
  imageParts,
  systemMessage
) {
  if (!GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY is not configured."
    );
  }

  const content = [
    {
      type: "text",
      text:
        String(userMessage || "Analyze this image.")
    },
    ...imageParts
  ];

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`
      },

      body: JSON.stringify({
        model: GROQ_VISION_MODEL,

        messages: [
          {
            role: "system",
            content: systemMessage
          },
          {
            role: "user",
            content
          }
        ],

        temperature: 0.4,
        max_tokens: 1024
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error(
      "Groq vision error:",
      data
    );

    const errorMessage =
      data?.error?.message ||
      `Groq vision request failed with status ${response.status}`;

    throw new Error(errorMessage);
  }

  return (
    data?.choices?.[0]?.message?.content ||
    "I couldn't analyze the image."
  );
}


// ============================================================
// IMAGE REQUEST DETECTION
// ============================================================

function isImageRequest(message = "") {
  const text = String(message)
    .toLowerCase()
    .trim();

  const commands = [
    "/image",
    "/imagine"
  ];

  if (
    commands.some(command =>
      text.startsWith(command)
    )
  ) {
    return true;
  }

  const phrases = [
    "generate an image",
    "generate image",
    "create an image",
    "make an image",
    "draw an image",
    "create a picture",
    "make a picture",
    "generate a picture"
  ];

  return phrases.some(phrase =>
    text.includes(phrase)
  );
}

// ============================================================
// CLEAN IMAGE PROMPT
// ============================================================

function cleanImagePrompt(message = "") {
  let prompt = String(message).trim();

  prompt = prompt.replace(
    /^\/image\s*/i,
    ""
  );

  prompt = prompt.replace(
    /^\/imagine\s*/i,
    ""
  );

  prompt = prompt.replace(
    /^(generate|create|make|draw)\s+(an?\s+)?(image|picture)\s*(of)?\s*/i,
    ""
  );

  return prompt.trim();
}

// ============================================================
// OPENAI IMAGE GENERATION
// ============================================================

async function generateImage(prompt) {
  if (!OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not configured."
    );
  }

  if (!prompt.trim()) {
    throw new Error(
      "Please provide an image prompt."
    );
  }

  const response = await fetch(
    "https://api.openai.com/v1/images/generations",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },

      body: JSON.stringify({
        model: OPENAI_IMAGE_MODEL,
        prompt: prompt,
        size: "1024x1024"
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error(
      "OpenAI image error:",
      data
    );

    const errorMessage =
      data?.error?.message ||
      `OpenAI image request failed with status ${response.status}`;

    throw new Error(errorMessage);
  }

  const image = data?.data?.[0];

  if (!image) {
    throw new Error(
      "No image was returned."
    );
  }

  return {
    url: image.url || null,
    b64_json: image.b64_json || null
  };
}

// ============================================================
// HEALTH CHECK
// ============================================================

app.get(
  "/api/healthz",
  (req, res) => {
    res.json({
      ok: true,
      service: "Zono AI",
      creator: "Ahathish Kumaran",

      groq: Boolean(
        GROQ_API_KEY
      ),

      openai: Boolean(
        OPENAI_API_KEY
      ),

      mayiladuthuraiKnowledge: true,

      timestamp:
        new Date().toISOString()
    });
  }
);

// ============================================================
// MAIN CHAT API
// ============================================================

app.post(
  "/api/chat",
  upload.array("files", 5),

  async (req, res) => {
    try {
      let message = "";

      // --------------------------------------------------------
      // JSON REQUEST
      // --------------------------------------------------------

      if (
        req.body &&
        typeof req.body.message === "string"
      ) {
        message = req.body.message;
      }

      // --------------------------------------------------------
      // MULTIPART REQUEST
      // --------------------------------------------------------

      if (
        !message &&
        req.body?.prompt
      ) {
        message = req.body.prompt;
      }

      message = String(
        message || ""
      ).trim();

      if (!message) {
        return res.status(400).json({
          error: "Message is required."
        });
      }

      // --------------------------------------------------------
      // FILES
      // --------------------------------------------------------

      let files = Array.isArray(req.files)
        ? req.files
        : [];

      // --------------------------------------------------------
      // JSON / BASE64 FILES
      // --------------------------------------------------------

      if (
        req.body &&
        Array.isArray(req.body.files) &&
        req.body.files.length > 0
      ) {
        const base64Files =
          convertBase64Files(
            req.body.files
          );

        files = [
          ...files,
          ...base64Files
        ].slice(0, 5);
      }

      console.log(
        "Chat request:",
        message.slice(0, 100),
        "| files:",
        files.length
      );

      // --------------------------------------------------------
      // IMAGE GENERATION
      // --------------------------------------------------------

      if (
        isImageRequest(message)
      ) {
        const prompt =
          cleanImagePrompt(message);

        if (!prompt) {
          return res.json({
            type: "text",

            reply:
              "Please tell me what image you want me to generate."
          });
        }

        try {
          const image =
            await generateImage(
              prompt
            );

          return res.json({
            type: "image",

            reply:
              "Here is the generated image.",

            image
          });
        } catch (imageError) {
          console.error(
            "Image generation error:",
            imageError.message
          );

          return res.status(500).json({
            error:
              imageError.message
          });
        }
      }

      // --------------------------------------------------------
      // SYSTEM MESSAGE
      // --------------------------------------------------------

      let systemMessage =
        buildSystemMessage(
          message
        );

      // --------------------------------------------------------
      // DOCUMENTS
      // --------------------------------------------------------

      const documentContext =
        await buildDocumentContext(
          files
        );

      if (documentContext) {
        systemMessage +=
          "\n\n" +
          documentContext;
      }

      // --------------------------------------------------------
      // IMAGES
      // --------------------------------------------------------

      const imageParts =
        getImageParts(files);

      if (
        imageParts.length > 0
      ) {
        const reply =
          await groqVision(
            message,
            imageParts,
            systemMessage
          );

        return res.json({
          type: "text",
          reply
        });
      }

      // --------------------------------------------------------
      // CHAT HISTORY
      // --------------------------------------------------------

      let history = [];

      if (
        Array.isArray(
          req.body?.history
        )
      ) {
        history =
          req.body.history;
      }

      const messages =
        normalizeMessages(
          history,
          message
        );

      // --------------------------------------------------------
      // NORMAL GROQ CHAT
      // --------------------------------------------------------

      const reply =
        await groqChat(
          messages,
          systemMessage
        );

      return res.json({
        type: "text",
        reply
      });

    } catch (error) {
      console.error(
        "CHAT ERROR:",
        error
      );

      return res.status(500).json({
        error:
          error?.message ||
          "Something went wrong while processing your request."
      });
    }
  }
);

// ============================================================
// DIRECT IMAGE API
// ============================================================

app.post(
  "/api/image",
  async (req, res) => {
    try {
      const prompt =
        String(
          req.body?.prompt || ""
        ).trim();

      if (!prompt) {
        return res.status(400).json({
          error:
            "Image prompt is required."
        });
      }

      const image =
        await generateImage(
          prompt
        );

      return res.json({
        type: "image",

        reply:
          "Here is the generated image.",

        image
      });

    } catch (error) {
      console.error(
        "IMAGE API ERROR:",
        error
      );

      return res.status(500).json({
        error:
          error?.message ||
          "Image generation failed."
      });
    }
  }
);

// ============================================================
// SERVE ZONO FRONTEND
// ============================================================

app.get(
  "/",
  (req, res) => {
    res.sendFile(
      path.join(
        __dirname,
        "index.html"
      )
    );
  }
);

// ============================================================
// ERROR HANDLER
// ============================================================

app.use(
  (err, req, res, next) => {
    console.error(
      "SERVER ERROR:",
      err
    );

    res.status(500).json({
      error:
        err?.message ||
        "Internal server error."
    });
  }
);

// ============================================================
// START SERVER
// ============================================================

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      "=========================================="
    );

    console.log(
      `Zono AI running on port ${PORT}`
    );

    console.log(
      "=========================================="
    );
  }
);