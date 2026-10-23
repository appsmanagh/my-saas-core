
//26. este es el contrato de repositorio para roles
import type {
Role,
CreateRoleInput,
UpdateRoleInput,
} from "./role";

import type { DatabaseTransaction } from "../database/transactional-database";

export interface RoleRepository {

//36. ¿Qué cambia?
  // Antes, create(input) solo podía insertar usando la conexión del repositorio. Ahora puede recibir una transacción:
  // await roleRepository.create(input, transaction);
  // Y las llamadas existentes siguen siendo válidas:
  // await roleRepository.create(input);
  
create(
input: CreateRoleInput,
transaction?: DatabaseTransaction,
): Promise<Role>;

findById(id: string): Promise<Role | null>;

findByName(
organizationId: string,
name: string,
): Promise<Role | null>;

findByOrganization(
organizationId: string,
): Promise<Role[]>;

update(
id: string,
input: UpdateRoleInput,
): Promise<Role | null>;

delete(id: string): Promise<void>;
}

// 26. Una decisión importante: findByName() recibe tanto organizationId como name. Dos organizaciones diferentes pueden tener un rol llamado admin, pero no queremos duplicados dentro de la misma organización.

// Más adelante, PostgreSQL también deberá garantizarlo mediante una restricción UNIQUE (organization_id, name). La validación del servicio por sí sola no evita condiciones de carrera.