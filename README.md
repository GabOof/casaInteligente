# Casa Inteligente

Este projeto implementa um middleware para um sistema de Casa Inteligente, que utiliza MQTT para comunicação entre sensores, atuadores e controladores. O sistema armazena as temperaturas em um banco de dados MongoDB e controla o estado do aquecedor (ligado ou desligado) com base nos dados recebidos.

## Funcionalidades

- **Sensores**: Publicam a temperatura atual em intervalos regulares (a cada 5 segundos) via MQTT.
- **Atuadores**: Controlam o aquecedor com base na temperatura. Se a temperatura for inferior a 18°C, o aquecedor é ligado; se for superior a 22°C, ele é desligado.
- **Middleware**: Recebe dados dos sensores, armazena as temperaturas no banco de dados MongoDB e gerencia os comandos de aquecedor.
- **Frontend**: Interface web simples que exibe a temperatura atual e o status do aquecedor, além de permitir o controle manual do aquecedor (ligar/desligar).

## Como Rodar

### 1. Instalar Dependências do Projeto

Certifique-se de que todas as dependências do projeto estão instaladas corretamente. Navegue até a pasta do seu projeto e execute o comando:

```bash
npm install
```

Isso irá baixar e instalar as dependências listadas no arquivo `package.json`.

### 2. Iniciar o Sensor

Para rodá-lo, abra o terminal e execute:

```bash
node sensor/sensor.js
```

O sensor começará a gerar valores de temperatura aleatórios e publicá-los no broker MQTT a cada 5 segundos.

### 3. Iniciar o Controlador

Para rodá-lo, execute:

```bash
node controller/controller.js
```

O controlador se conectará ao broker MQTT e, ao receber os dados de temperatura, tomará decisões (ligar/desligar o aquecedor) com base na lógica definida.

### 4. Iniciar o Middleware (Servidor Express)

Para rodar o servidor Express, execute:

```bash
node middleware/server.js
```

Isso irá iniciar um servidor na porta 3000 que permitirá ao cliente visualizar o status da temperatura e controlar o aquecedor via uma API.

### 5. Abrir o Cliente (Frontend)

Agora, abra o arquivo `client/index.html` e inicie o servidor utilizando a extensão [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer).

### 6. Verificar o Funcionamento

- **No Cliente**: No navegador, você verá a temperatura sendo atualizada a cada 5 segundos, e o status do aquecedor (ligado/desligado).
- **No Sensor**: O sensor deve enviar dados aleatórios de temperatura a cada 5 segundos.
- **No Controlador**: O controlador deve receber as mensagens de temperatura e ligar/desligar o aquecedor conforme a lógica que foi implementada.
- **No Banco de Dados**: O banco de dados MongoDB deve armazenar a temperatura recebida e o status do aquecedor.

## Tecnologias

- **MQTT**: Para comunicação entre sensores, atuadores e o middleware.
- **MongoDB**: Para armazenar as temperaturas recebidas e o status do aquecedor.
- **Node.js**: Plataforma para executar o middleware.
- **Express**: Framework para criar o servidor que intermedeia a comunicação entre o cliente e os sistemas.
- **HTML/CSS/JavaScript**: Para criar a interface do cliente.
- **CORS**: Para permitir que o cliente acesse o servidor Express.

## Arquitetura

1. **Sensores**: Enviam dados de temperatura para o broker MQTT.
2. **Broker MQTT**: Recebe as mensagens dos sensores e as publica no tópico MQTT.
3. **Middleware**:
   - Se inscreve no tópico MQTT para receber as mensagens de temperatura.
   - Armazena as temperaturas no banco de dados MongoDB.
   - Controla o aquecedor com base nas temperaturas recebidas.
   - Expõe APIs REST para que o frontend possa obter o status do aquecedor e a última temperatura registrada.
4. **Frontend (Client)**: Interface para visualizar os dados de temperatura e controlar o aquecedor.

## Variáveis de Ambiente

As variáveis de configuração para o MQTT podem ser definidas no arquivo `config/mqttConfig.js`. Exemplo de configuração:

```javascript
module.exports = {
  mqttHost: "mqtt://localhost", // Endereço do broker MQTT
  mqttTopic: "temperature", // Tópico para receber os dados de temperatura
  heaterTopic: "heater-control", // Tópico para controlar o aquecedor
};
```

## Banco de Dados

O MongoDB será utilizado para armazenar os dados de temperatura e o status do aquecedor. O banco de dados padrão é `casaInteligente`, e as coleções são `temperatures` e `heaters`.

Certifique-se de ter o MongoDB em execução na sua máquina antes de iniciar o middleware.
