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
let isMainControllerAlive = true;
let mainControllerFailureTime = null; // Para rastrear o tempo de falha do principal
let backupControllerStarted = false; // Flag para verificar se o backup foi iniciado

// Função de inicialização do backup controlador
async function initializeBackupController() {
  if (backupControllerStarted) {
    console.log("Backup controlador já foi iniciado.");
    return; // Evita reiniciar o controlador de backup
  }

  try {
    console.log("Backup controlador iniciado");

    // Conectar ao banco de dados
    await connectToDb();
    console.log("Banco de dados conectado");

    // Inicializando o cliente MQTT
    client = mqtt.connect(mqttHost);

    client.on("connect", () => {
      console.log("Backup controlador conectado ao broker MQTT");

      // Inscreve-se no tópico de temperatura
      client.subscribe(mqttTopic, (err) => {
        if (err) {
          console.error(`Erro ao se inscrever no tópico ${mqttTopic}:`, err);
        } else {
          console.log(`Inscrito com sucesso no tópico ${mqttTopic}`);
        }
      });
    });

    // Escutando as mensagens dos tópicos
    client.on("message", async (topic, message) => {
      console.log(`Mensagem recebida no tópico ${topic}: ${message}`);

      // Processando a temperatura apenas se o controlador principal estiver inativo
      if (topic === mqttTopic && !isMainControllerAlive) {
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

    backupControllerStarted = true; // Marca o backup como iniciado
  } catch (error) {
    console.error("Erro ao inicializar controlador de backup", error);
    process.exit(1);
  }
}

// Função para verificar a saúde do controlador principal
function checkMainControllerHealth() {
  // Se o backup controlador já foi iniciado, não precisa mais verificar a saúde do principal
  if (backupControllerStarted) {
    console.log(
      "Backup controlador iniciado. Verificação do principal interrompida."
    );
    return;
  }

  // Subscribing to heartbeat topic outside the initialization function
  const heartbeatClient = mqtt.connect(mqttHost);

  heartbeatClient.on("connect", () => {
    console.log(
      "Backup controlador conectado ao broker MQTT para monitorar heartbeat"
    );
    heartbeatClient.subscribe(heartbeatTopic, (err) => {
      if (err) {
        console.error(`Erro ao se inscrever no tópico ${heartbeatTopic}:`, err);
      } else {
        console.log(`Inscrito com sucesso no tópico ${heartbeatTopic}`);
      }
    });
  });

  heartbeatClient.on("message", (topic, message) => {
    if (topic === heartbeatTopic) {
      if (message.toString() === "alive") {
        isMainControllerAlive = true; // O controlador principal está ativo
        mainControllerFailureTime = null; // Resetando o tempo de falha
        console.log("Heartbeat recebido. Controlador principal está ativo.");
      }
    }
  });

  // Intervalo para verificar a saúde do controlador principal
  setInterval(() => {
    if (!isMainControllerAlive) {
      // Verifica se o controlador principal falhou por mais de 30 segundos
      if (!mainControllerFailureTime) {
        mainControllerFailureTime = Date.now();
      } else if (Date.now() - mainControllerFailureTime > 30000) {
        console.log(
          "Controlador principal inativo há mais de 30 segundos. Iniciando o backup."
        );
        initializeBackupController(); // Inicializa o backup se o principal falhar
      }
    } else {
      console.log("Controlador principal ativo, aguardando falha.");
      isMainControllerAlive = false; // Reseta a flag após cada intervalo
    }
  }, 15000); // Verifica a cada 15 segundos
}

// Inicializa a verificação de saúde do controlador principal
checkMainControllerHealth();
