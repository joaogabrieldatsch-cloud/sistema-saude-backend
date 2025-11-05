// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

// Configurações (Render → Environment)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.REPO_OWNER || "joaogabrieldatsch-cloud";
const REPO_NAME = process.env.REPO_NAME || "sistema-saude-site";
const FILE_PATH = process.env.FILE_PATH || "unidades.json";
const API_SECRET = process.env.API_SECRET || "";

app.get("/", (req, res) => res.send("✅ Backend ativo - Use POST /update-json"));

app.post("/update-json", async (req, res) => {
  try {
    if (API_SECRET && req.headers["x-api-secret"] !== API_SECRET)
      return res.status(403).json({ success: false, error: "Acesso negado" });

    const newData = req.body;
    if (!Array.isArray(newData))
      return res.status(400).json({ success: false, error: "JSON inválido" });

    // Obter SHA atual
    const getFile = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` }
    });
    const fileData = await getFile.json();
    const sha = fileData.sha;

    // Atualizar arquivo
    const content = Buffer.from(JSON.stringify(newData, null, 2)).toString("base64");
    const update = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "Atualização via painel administrativo",
        content,
        sha
      })
    });

    const result = await update.json();
    res.json({ success: true, result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Servidor rodando na porta " + PORT));
