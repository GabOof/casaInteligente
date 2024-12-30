const mqtt = require("mqtt");
const { connectToDb } = require("./database");
const { mqttHost, heaterTopic } = require("../config/mqttConfig");

const client = mqtt.connect(mqttHost);

// Função para atualizar o status do aquecedor no banco de dados
async function updateHeaterStatus(status) {
  try {
    const collection = db.collection("heaters");
    await collection.insertOne({ status: status, timestamp: new Date() });
    console.log(`Status do aquecedor atualizado para: ${status}`);
  } catch (error) {
    console.error("Erro ao atualizar o status do aquecedor", error);
    throw error; // Re-throw the error to be caught by the controller
  }
}

async function initialize() {
  try {
    await connectToDb(); // Aguarda a conexão com o MongoDB
    console.log("Conectado ao banco de dados");

    client.on("connect", () => {
      console.log("Controlador conectado ao broker MQTT");
      client.subscribe("home/temperature");
    });

    client.on("message", async (topic, message) => {
      if (topic === "home/temperature") {
        const { temperature } = JSON.parse(message.toString());
        console.log(`Temperatura recebida: ${temperature}`);

        try {
          const collection = db.collection("temperatures");
          // Insira o valor da temperatura no banco de dados
          await collection.insertOne({
            value: temperature,
            timestamp: new Date(),
          });
          console.log("Temperatura registrada no banco de dados");
        } catch (error) {
          console.error("Erro ao registrar a temperatura", error);
        }

        // Lógica de controle do aquecedor
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
  } catch (error) {
    console.error("Erro ao inicializar o controlador", error);
    process.exit(1); // Encerra o processo em caso de erro
  }
}

initialize();
