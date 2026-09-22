
import { createDatabase } from "../database/database-provider";
// 3. Aqui se prueba el contrato
async function main() {
    // 3. asi se crea una DDBB sin importar cual sea el motor ddbb
  const database = createDatabase();
// 3 Esta es la function que chequea 
  console.log("Before connection:", await database.healthCheck());
 // 3 Esta es la function que conecta 
  await database.connect();

  console.log("After connection:", await database.healthCheck());
 // 3 Esta es la function que desconecta 
  await database.disconnect();

  console.log("After disconnection:", await database.healthCheck());
}

main();