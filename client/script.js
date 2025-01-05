// Função para obter o status do aquecedor
async function getHeaterStatus() {
  try {
    const response = await fetch("http://localhost:3000/heater-status");
    const data = await response.json();
    let statusText = "Desconhecido";
    let heaterEmoji = "🔴"; // Padrão para desligado

    if (data.status) {
      if (data.status === "on") {
        statusText = "Ligado";
        heaterEmoji = "🟢"; // Emojizinho para aquecedor ligado
      } else {
        statusText = "Desligado";
        heaterEmoji = "🔴"; // Emojizinho para aquecedor desligado
      }
    }

    // Atualiza o texto do status do aquecedor com o emoji
    document.getElementById(
      "heater-status"
    ).innerText = `${statusText} ${heaterEmoji}`;
  } catch (error) {
    console.error("Erro ao obter o status do aquecedor", error);
  }
}

// Função para obter a temperatura
async function getTemperature() {
  try {
    const response = await fetch("http://localhost:3000/temperature");
    const data = await response.json();
    let temperatureText = "--";
    let temperatureEmoji = "❄️"; // Padrão para floco de neve (temperaturas abaixo de 18)

    if (data.temperature !== null) {
      const temperature = parseFloat(data.temperature);

      if (temperature >= 22) {
        temperatureText = `${temperature.toFixed(2)}ºC`;
        temperatureEmoji = "☀️"; // Emojizinho para temperatura acima de 22°C (sol)
      } else if (temperature < 18) {
        temperatureText = `${temperature.toFixed(2)}ºC`;
        temperatureEmoji = "❄️"; // Emojizinho para temperatura abaixo de 18°C (neve)
      } else {
        temperatureText = `${temperature.toFixed(2)}ºC`;
        temperatureEmoji = "🌤️"; // Emojizinho para temperaturas entre 18 e 22°C (temperatura amena)
      }
    }

    // Atualiza o texto da temperatura com o emoji
    document.getElementById(
      "temperature"
    ).innerText = `${temperatureText} ${temperatureEmoji}`;
  } catch (error) {
    console.error("Erro ao obter a temperatura", error);
  }
}

async function sendCommand(command) {
  try {
    const response = await fetch("http://localhost:3000/heater-command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command }),
    });
    const data = await response.json();
    // Atualiza o status após enviar o comando
    getHeaterStatus();
  } catch (error) {
    console.error("Erro ao enviar o comando", error);
  }
}

// Função para alternar o aquecedor
async function toggleHeater() {
  try {
    // Obter o status atual
    const response = await fetch("http://localhost:3000/heater-status");
    const data = await response.json();

    // Determine o novo comando baseado no status atual
    const newCommand = data.status === "on" ? "off" : "on";

    // Enviar o comando
    await sendCommand(newCommand);

    // Atualizar a interface com o novo status
    await getHeaterStatus();
  } catch (error) {
    console.error("Erro ao alternar o aquecedor", error);
  }
}

// Atualiza o botão com base no status do aquecedor
async function updateToggleButton() {
  try {
    const response = await fetch("http://localhost:3000/heater-status");
    const data = await response.json();
    const button = document.getElementById("toggle-heater");

    if (data.status === "on") {
      button.innerText = "Desligar Aquecedor";
      button.style.background = "linear-gradient(45deg, #f44336, #d32f2f)"; // Vermelho
    } else {
      button.innerText = "Ligar Aquecedor";
      button.style.background = "linear-gradient(45deg, #4caf50, #45a049)"; // Verde
    }
  } catch (error) {
    console.error("Erro ao atualizar botão de alternância", error);
  }
}

// Função para inicializar os dados da página
async function initializePage() {
  await getHeaterStatus();
  await getTemperature();
}

// Atualize a interface regularmente
setInterval(() => {
  getHeaterStatus();
  getTemperature();
  updateToggleButton();
}, 100);

// Inicializa a página
window.onload = async function () {
  await initializePage();
  await updateToggleButton();
};
