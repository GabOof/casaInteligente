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
        } else {
          console.log(`Inscrito com sucesso no tópico ${mqttTopic}`);
        }
      });
    });

    // Enviar heartbeat a cada 10 segundos para informar que o controlador principal está ativo
    setInterval(() => {
      client.publish(heartbeatTopic, "alive");
      console.log("Heartbeat enviado pelo controlador principal.");
    }, 1000); // A cada 1 segundos

    // Escutando as mensagens do tópico
    client.on("message", async (topic, message) => {
      console.log(`Mensagem recebida no tópico ${topic}: ${message}`);

      if (topic === mqttTopic) {
        try {
          const { temperature } = JSON.parse(message.toString());
          console.log(`Temperatura processada: ${temperature}`);

          // Armazenar temperatura no banco
          await storeTemperature(parseFloat(temperature));

          // Decisão de ligar/desligar o aquecedor
          if (temperature < 15) {
            await updateHeaterStatus("on");
            client.publish(heaterTopic, "on");
            console.log("Aquecedor ligado");
          } else if (temperature >= 22) {
            await updateHeaterStatus("off");
            client.publish(heaterTopic, "off");
            console.log("Aquecedor desligado");
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
