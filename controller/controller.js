const mqtt = require("mqtt");
const { mqttHost, mqttTopic, heaterTopic } = require("../config/mqttConfig");
const {
  connectToDb,
  storeTemperature,
  updateHeaterStatus,
} = require("../database/database");

let client; // Definindo a variável 'client' aqui.

async function initializeController() {
  try {
    // Certifique-se de que a conexão ao banco de dados foi estabelecida primeiro.
    await connectToDb();
    console.log("Banco de dados conectado");

    // Inicializando o cliente MQTT depois de garantir que o banco está conectado
    client = mqtt.connect(mqttHost);

    client.on("connect", () => {
      console.log("Controlador conectado ao broker MQTT");
      client.subscribe(mqttTopic, (err) => {
        if (err) {
          console.error(`Erro ao se inscrever no tópico ${mqttTopic}:`, err);
        } else {
          console.log(`Inscrito com sucesso no tópico ${mqttTopic}`);
        }
      });
    });

    client.on("message", async (topic, message) => {
      console.log(`Mensagem recebida no tópico ${topic}: ${message}`);

      if (topic === mqttTopic) {
        try {
          const { temperature } = JSON.parse(message.toString());
          console.log(`Temperatura processada: ${temperature}`);

          // Armazenar temperatura no banco
          await storeTemperature(parseFloat(temperature));

          // Decisão de ligar/desligar o aquecedor
          if (temperature < 18) {
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
    console.error("Erro ao inicializar controlador", error);
    process.exit(1);
  }
}

initializeController();
