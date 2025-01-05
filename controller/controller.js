const mqtt = require("mqtt");
const {
  mqttHost,
  mqttTopic,
  heaterTopic,
  heartbeatTopic,
} = require("../config/mqttConfig");
const {
  connectToDb,
  storeTemperature,
  updateHeaterStatus,
} = require("../database/database");
const fs = require("fs");
const { verify } = require("crypto");

// Carregar chave pública
const publicKey = fs.readFileSync("public_key.pem", "utf8");

let client; // Definindo a variável 'client' aqui

async function initializeController() {
  try {
    // Conectar ao banco de dados
    await connectToDb();
    console.log("Banco de dados conectado");

    // Inicializando o cliente MQTT
    client = mqtt.connect(mqttHost);

    client.on("connect", () => {
      console.log("Controlador principal conectado ao broker MQTT");

      // Inscreve-se no tópico para receber as mensagens do cliente
      client.subscribe(mqttTopic, (err) => {
        if (err) {
          console.error(`Erro ao se inscrever no tópico ${mqttTopic}:`, err);
        }
      });
    });

    // Enviar heartbeat a cada 10 segundos para informar que o controlador principal está ativo
    setInterval(() => {
      client.publish(heartbeatTopic, "alive");
    }, 1000); // A cada 1 segundos

    // Escutando as mensagens do tópico
    client.on("message", async (topic, message) => {
      if (topic === mqttTopic) {
        try {
          const { message: data, signature } = JSON.parse(message.toString());

          // Verificar assinatura
          const isValid = verify(
            "sha256",
            Buffer.from(data),
            publicKey,
            Buffer.from(signature, "base64")
          );

          if (!isValid) {
            throw new Error("Assinatura inválida. Dados comprometidos.");
          }

          // Parse data to extract the actual payload
          const parsedMessage = JSON.parse(data);

          // Garantir que o valor de temperatura seja um número
          parsedMessage.temperature = parseFloat(parsedMessage.temperature);

          // Validação básica
          if (
            typeof parsedMessage.temperature !== "number" ||
            parsedMessage.temperature < -9 || // Limite mínimo esperado
            parsedMessage.temperature > 41 // Limite máximo esperado
          ) {
            throw new Error("Valor de temperatura inválido recebido");
          }

          const { temperature } = parsedMessage;

          // Processamento de dados validos
          await storeTemperature(temperature);

          // Decisão de ligar/desligar o aquecedor
          if (temperature < 15) {
            await updateHeaterStatus("on");
            client.publish(heaterTopic, "on");
          } else if (temperature >= 22) {
            await updateHeaterStatus("off");
            client.publish(heaterTopic, "off");
          }
        } catch (error) {
          console.error("Erro ao processar mensagem MQTT:", error);
        }
      }
    });
  } catch (error) {
    console.error("Erro ao inicializar controlador principal", error);
    process.exit(1);
  }
}

// Inicializa o controlador principal
initializeController();
