const express = require("express");
const cors = require("cors");
const {
  connectToDb,
  getHeaterStatus,
  getTemperature,
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

  app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
  });
})();
