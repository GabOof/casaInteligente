const { generateKeyPairSync } = require("crypto");
const fs = require("fs");

// Gerar par de chaves
const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});

// Salvar a chave pública
fs.writeFileSync(
  "public_key.pem",
  publicKey.export({ type: "pkcs1", format: "pem" })
);

// Salvar a chave privada
fs.writeFileSync(
  "private_key.pem",
  privateKey.export({ type: "pkcs1", format: "pem" })
);

console.log(
  "Chaves RSA geradas e salvas como public_key.pem e private_key.pem"
);
