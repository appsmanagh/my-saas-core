
// 30. Esta interfaz es el contrato: tanto un repositorio en memoria como uno de PostgreSQL tendrán que implementar estas operaciones. 
// El servicio no necesitará saber cuál utiliza.

import type {
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from "./organization";

export interface OrganizationRepository {
  create(input: CreateOrganizationInput): Promise<Organization>;

  findById(id: string): Promise<Organization | null>;

  findBySlug(slug: string): Promise<Organization | null>;

  findAll(): Promise<Organization[]>;

  update(
    id: string,
    input: UpdateOrganizationInput,
  ): Promise<Organization | null>;

  delete(id: string): Promise<void>;
}