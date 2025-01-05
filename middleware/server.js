const express = require("express");
const cors = require("cors");
const {
  connectToDb,
  getHeaterStatus,
  getTemperature,
  updateHeaterStatus,
} = require("../database/database");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

(async function initializeServer() {
  await connectToDb();

  app.get("/heater-status", async (req, res) => {
    try {
      const status = await getHeaterStatus();
      res.json({ status });
    } catch (error) {
      res.status(500).json({ error: "Erro ao obter o status do aquecedor" });
    }
  });

  app.get("/temperature", async (req, res) => {
    try {
      const temperature = await getTemperature();
      res.json({ temperature });
    } catch (error) {
      res.status(500).json({ error: "Erro ao obter a temperatura" });
    }
  });

  // Rota para processar os comandos de ligar/desligar o aquecedor
  app.post("/heater-command", async (req, res) => {
    try {
      const { command } = req.body;
      if (!command) {
        return res.status(400).json({ error: "Comando não fornecido" });
      }
      // Atualiza o status do aquecedor no banco de dados
      await updateHeaterStatus(command);
      // Resposta ao cliente
      res.json({ message: `Comando "${command}" recebido com sucesso` });
    } catch (error) {
      console.error("Erro ao processar o comando:", error); // Exibe o erro no log
      res.status(500).json({ error: "Erro ao processar o comando" });
    }
  });

  app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
  });
})();
