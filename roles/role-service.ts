
//26. este es el service de roles se enrga de manejar la logica de negocio
// 26. ¿Qué acabamos de conseguir?
// Validación
// No permite nombres vacíos ni identificadores de organización vacíos.
// Prevención de duplicados
// Comprueba si ya existe un rol con ese nombre dentro de la organización.
// Actualización controlada
// Solo permite modificar name y description. No permite cambiar el organizationId mediante updateRole().
// Errores coherentes
// Utiliza nuestros errores existentes: ValidationError, NotFoundError y ConflictError.

import type {
  Role,
  CreateRoleInput,
  UpdateRoleInput,
} from "./role";

import type { RoleRepository } from "./role-repository";

import {
  ValidationError,
  NotFoundError,
  ConflictError,
} from "../errors";


//37. se inporta el modulo de transaction para transaction support para organization+rolowner+permissions+membresia
import type { DatabaseTransaction } from "../database/transactional-database";

export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository,
  ) {}
  // 37. se agrega DatabaseTransaction para manejar transactio support
  async createRole(
    input: CreateRoleInput,
    transaction?: DatabaseTransaction,
  ): Promise<Role> {
    const organizationId = input.organizationId.trim();
    const name = input.name.trim();
    const description = input.description?.trim() || null;

    if (!organizationId) {
      throw new ValidationError(
        "Organization ID is required",
      );
    }

    if (!name) {
      throw new ValidationError("Role name is required");
    }

    const existingRole =
      await this.roleRepository.findByName(
        organizationId,
        name,
      );

    if (existingRole) {
      throw new ConflictError(
        "A role with this name already exists in this organization",
      );
    }
    // 37. se agrega transaction para manejar transactio support
   return this.roleRepository.create(
    {
      organizationId,
      name,
      description,
    },
    transaction,
  );
  }

  async getRoleById(id: string): Promise<Role> {
    if (!id.trim()) {
      throw new ValidationError("Role ID is required");
    }

    const role = await this.roleRepository.findById(id);

    if (!role) {
      throw new NotFoundError("Role not found");
    }

    return role;
  }

  async getRolesByOrganization(
    organizationId: string,
  ): Promise<Role[]> {
    if (!organizationId.trim()) {
      throw new ValidationError(
        "Organization ID is required",
      );
    }

    return this.roleRepository.findByOrganization(
      organizationId,
    );
  }

  async updateRole(
    id: string,
    input: UpdateRoleInput,
  ): Promise<Role> {
    const role = await this.getRoleById(id);

    const updates: UpdateRoleInput = {};

    if (input.name !== undefined) {
      const name = input.name.trim();

      if (!name) {
        throw new ValidationError(
          "Role name is required",
        );
      }

      if (name !== role.name) {
        const existingRole =
          await this.roleRepository.findByName(
            role.organizationId,
            name,
          );

        if (existingRole) {
          throw new ConflictError(
            "A role with this name already exists in this organization",
          );
        }
      }

      updates.name = name;
    }

    if (input.description !== undefined) {
      updates.description =
        input.description?.trim() || null;
    }

    if (Object.keys(updates).length === 0) {
      throw new ValidationError(
        "At least one field must be provided",
      );
    }

    const updatedRole =
      await this.roleRepository.update(id, updates);

    if (!updatedRole) {
      throw new NotFoundError("Role not found");
    }

    return updatedRole;
  }

  async deleteRole(id: string): Promise<void> {
    await this.getRoleById(id);
    await this.roleRepository.delete(id);
  }
}