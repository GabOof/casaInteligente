const mqtt = require("mqtt");
const fs = require("fs");
const { sign } = require("crypto");
const { mqttHost, mqttTopic } = require("../config/mqttConfig");

// Carregar chave privada
const privateKey = fs.readFileSync("private_key.pem", "utf8");

const client = mqtt.connect(mqttHost);

client.on("connect", () => {
  console.log("Sensor conectado ao broker MQTT");

  setInterval(() => {
    const temperature = (Math.random() * 50 - 10).toFixed(2); // Gera temperatura entre -10°C e 40°C
    const message = JSON.stringify({ temperature, timestamp: Date.now() });

    // Assinar mensagem
    const signature = sign("sha256", Buffer.from(message), privateKey).toString(
      "base64"
    );

    // Publicar mensagem e assinatura
    client.publish(mqttTopic, JSON.stringify({ message, signature }));
  }, 5000); // Publica a cada 5 segundos
});
