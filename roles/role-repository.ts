
//26. este es el contrato de repositorio para roles
import type {
  Role,
  CreateRoleInput,
  UpdateRoleInput,
} from "./role";

export interface RoleRepository {
  create(input: CreateRoleInput): Promise<Role>;

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