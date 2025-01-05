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
let isMainControllerAlive = true;
let mainControllerFailureTime = null; // Para rastrear o tempo de falha do principal
let backupControllerStarted = false; // Flag para verificar se o backup foi iniciado

// Função de inicialização do backup controlador
async function initializeBackupController() {
  if (backupControllerStarted) {
    return; // Evita reiniciar o controlador de backup
  }

  try {
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
        }
      });
    });

    // Escutando as mensagens dos tópicos
    client.on("message", async (topic, message) => {
      // Processando a temperatura apenas se o controlador principal estiver inativo
      if (topic === mqttTopic && !isMainControllerAlive) {
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
      }
    });
  });

  heartbeatClient.on("message", (topic, message) => {
    if (topic === heartbeatTopic) {
      if (message.toString() === "alive") {
        isMainControllerAlive = true; // O controlador principal está ativo
        mainControllerFailureTime = null; // Resetando o tempo de falha
      }
    }
  });

  // Intervalo para verificar a saúde do controlador principal
  setInterval(() => {
    if (!isMainControllerAlive) {
      // Verifica se o controlador principal falhou por mais de 1 segundo
      if (!mainControllerFailureTime) {
        mainControllerFailureTime = Date.now();
      } else if (Date.now() - mainControllerFailureTime > 1000) {
        initializeBackupController(); // Inicializa o backup se o principal falhar
      }
    } else {
      isMainControllerAlive = false; // Reseta a flag após cada intervalo
    }
  }, 1000); // Verifica a cada 1 segundo
}

// Inicializa a verificação de saúde do controlador principal
checkMainControllerHealth();
