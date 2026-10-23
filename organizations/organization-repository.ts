
// 30. Esta interfaz es el contrato: tanto un repositorio en memoria como uno de PostgreSQL tendrán que implementar estas operaciones. 
// El servicio no necesitará saber cuál utiliza.

import type {
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from "./organization";

import type { DatabaseTransaction } from "../database/transactional-database";

export interface OrganizationRepository {
  //36. ¿Qué cambia?
  // Antes, create(input) solo podía insertar usando la conexión del repositorio. Ahora puede recibir una transacción:
  // await organizationRepository.create(input, transaction);
  // Y las llamadas existentes siguen siendo válidas:
  // await organizationRepository.create(input);
  
  create(
    input: CreateOrganizationInput,
    transaction?: DatabaseTransaction,
  ): Promise<Organization>;

  findById(id: string): Promise<Organization | null>;

  findBySlug(slug: string): Promise<Organization | null>;

  findAll(): Promise<Organization[]>;

  update(
    id: string,
    input: UpdateOrganizationInput,
  ): Promise<Organization | null>;

  delete(id: string): Promise<void>;
}