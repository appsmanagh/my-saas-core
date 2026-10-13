//26. este es lc ontrato de repositorio para permission
import type {
  Permission,
  PermissionKey,
} from "./permission";

export interface PermissionRepository {
  findById(id: string): Promise<Permission | null>;

  findByKey(
    key: PermissionKey,
  ): Promise<Permission | null>;

  findByKeys(
    keys: PermissionKey[],
  ): Promise<Permission[]>;

  findAll(): Promise<Permission[]>;
}

// 26. Observa que aquí no incluimos create, update ni delete.

// ¿Por qué? Porque, por ahora, los permisos son parte del catálogo definido por nuestra aplicación. Los administradores de las organizaciones podrán decidir qué permisos asignan a sus roles, pero no crear nuevas capacidades que el backend no sepa ejecutar.

// Por ejemplo, crear un permiso llamado users:teleport no debería otorgar ninguna capacidad real.