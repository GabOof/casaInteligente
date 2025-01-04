const mqttHost = "mqtt://localhost"; // Para broker local
const mqttTopic = "home/temperature"; // Tópico de temperatura
const heaterTopic = "home/heater"; // Tópico do aquecedor
const heartbeatTopic = "home/heartbeat"; // Tópico do heartbeat

module.exports = { mqttHost, mqttTopic, heaterTopic, heartbeatTopic };
