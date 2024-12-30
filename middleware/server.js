const express = require("express");
const cors = require("cors");
const {
  connectToDb,
  getHeaterStatus,
  getTemperature,
  updateHeaterStatus,
  storeTemperature,
} = require("../controller/database");
const mqtt = require("mqtt");

const app = express();
const port = 3000;

// Configurações do MQTT
const { mqttHost, mqttTopic, heaterTopic } = require("../config/mqttConfig");
const client = mqtt.connect(mqttHost);

app.use(cors()); // Permite CORS
app.use(express.json()); // Middleware para interpretar JSON no corpo da requisição
app.use(express.urlencoded({ extended: true })); // Para analisar dados do formulário

// Conectar ao banco de dados
connectToDb();

// Conectar ao broker MQTT
client.on("connect", () => {
  console.log("Servidor conectado ao broker MQTT");
  client.subscribe(mqttTopic); // Assina o tópico para receber as temperaturas
});

// Lógica para processar as mensagens recebidas do broker MQTT
client.on("message", async (topic, message) => {
  if (topic === mqttTopic) {
    const { temperature } = JSON.parse(message.toString());
    console.log(`Temperatura recebida: ${temperature}`);

    // Armazena a temperatura no banco de dados
    await storeTemperature(temperature);

    // Lógica de controle do aquecedor com base na temperatura
    if (temperature < 18) {
      await updateHeaterStatus("on");
      client.publish(heaterTopic, "on");
      console.log("Aquecedor ligado");
    } else if (temperature >= 22) {
      await updateHeaterStatus("off");
      client.publish(heaterTopic, "off");
      console.log("Aquecedor desligado");
    }
  }
});

// Rota para obter o status do aquecedor
app.get("/heater-status", async (req, res) => {
  try {
    const status = await getHeaterStatus();
    res.json({ status });
  } catch (error) {
    res.status(500).json({ error: "Erro ao obter o status do aquecedor" });
  }
});

// Rota para obter a temperatura
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

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Middleware rodando na porta ${port}`);
});
