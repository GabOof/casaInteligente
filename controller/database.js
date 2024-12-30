const { MongoClient } = require("mongodb");
const uri = "mongodb://localhost:27017"; // Substitua pelo seu URI de conexão

let db;

async function connectToDb() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    db = client.db("casaInteligente");
    console.log("Conectado ao MongoDB");
  } catch (err) {
    console.error("Erro ao conectar ao MongoDB", err);
    throw err;
  }
}

// Função para registrar a temperatura
async function storeTemperature(temperature) {
  try {
    const collection = db.collection("temperatures");
    await collection.insertOne({
      value: temperature,
      timestamp: new Date(),
    });
    console.log(`Temperatura registrada no banco de dados: ${temperature}`);
  } catch (error) {
    console.error("Erro ao registrar a temperatura:", error);
  }
}

// Função para atualizar o status do aquecedor
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

// Função para obter o status do aquecedor (último status)
async function getHeaterStatus() {
  const collection = db.collection("heaters");
  const status = await collection.findOne({}, { sort: { timestamp: -1 } }); // Ordena por timestamp, pegando o mais recente
  return status ? status.status : "Desconhecido"; // Retorna o status ou "Desconhecido" caso não haja status
}

// Função para obter a temperatura
async function getTemperature() {
  try {
    const collection = db.collection("temperatures");
    const temp = await collection.findOne({}, { sort: { _id: -1 } }); // Obtém o último documento de temperatura
    return temp ? temp.value : null; // Retorna o valor da temperatura ou null caso não exista
  } catch (error) {
    console.error("Erro ao obter a temperatura", error);
    throw error; // Lança o erro para ser capturado no controller
  }
}

module.exports = {
  connectToDb,
  getHeaterStatus,
  getTemperature,
  updateHeaterStatus,
  storeTemperature, // Adicionando a função storeTemperature
};
