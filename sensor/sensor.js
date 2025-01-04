const mqtt = require("mqtt");
const { mqttHost, mqttTopic } = require("../config/mqttConfig");

const client = mqtt.connect(mqttHost);

client.on("connect", () => {
  console.log("Sensor conectado ao broker MQTT");

  setInterval(() => {
    const temperature = (Math.random() * 30 + 10).toFixed(2); // Gera temperatura entre 10°C e 40°C
    client.publish(mqttTopic, JSON.stringify({ temperature }));
    console.log(`Temperatura publicada: ${temperature}`);
  }, 10000); // Publica a cada 10 segundos
});
