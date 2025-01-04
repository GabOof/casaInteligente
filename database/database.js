const { MongoClient } = require("mongodb");

const uri = "mongodb://localhost:27017"; // URI do MongoDB
let db;

async function connectToDb() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    db = client.db("casaInteligente"); // Aqui estamos atribuindo db
    console.log("Conectado ao MongoDB");
  } catch (err) {
    console.error("Erro ao conectar ao MongoDB", err);
    throw err; // Repassando erro para interromper a execução
  }
}

async function storeTemperature(temperature) {
  try {
    const collection = db.collection("temperatures"); // Aqui você acessa a coleção
    await collection.insertOne({
      value: temperature,
      timestamp: new Date(),
    });
    console.log(`Temperatura registrada: ${temperature}`);
  } catch (error) {
    console.error("Erro ao registrar temperatura", error);
  }
}

async function updateHeaterStatus(status) {
  try {
    const collection = db.collection("heaters"); // Aqui você acessa a coleção
    await collection.insertOne({ status, timestamp: new Date() });
    console.log(`Status do aquecedor atualizado para: ${status}`);
  } catch (error) {
    console.error("Erro ao atualizar status do aquecedor", error);
  }
}

async function getHeaterStatus() {
  try {
    const collection = db.collection("heaters");
    const status = await collection.findOne({}, { sort: { timestamp: -1 } });
    return status ? status.status : "Desconhecido";
  } catch (error) {
    console.error("Erro ao obter status do aquecedor", error);
  }
}

async function getTemperature() {
  try {
    const collection = db.collection("temperatures");
    const temp = await collection.findOne({}, { sort: { timestamp: -1 } });
    return temp ? temp.value : null;
  } catch (error) {
    console.error("Erro ao obter temperatura", error);
  }
}

module.exports = {
  connectToDb,
  storeTemperature,
  updateHeaterStatus,
  getHeaterStatus,
  getTemperature,
};
