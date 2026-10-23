
import type { TransactionalDatabase } from "../database/transactional-database";

import type {
  Organization,
  CreateOrganizationInput,
} from "./organization";

import type { OrganizationMember } from "./organization-member";
import type { OrganizationMemberRepository } from "./organization-member-repository";

import type { Role } from "../roles/role";
import type { PermissionKey } from "../permissions/permission";

import { OrganizationService } from "./organization-service";
import { RoleService } from "../roles/role-service";
import { RolePermissionService } from "../roles/role-permission-service";

import { ValidationError } from "../errors";

export interface CreateOrganizationWithOwnerResult {
  organization: Organization;
  ownerRole: Role;
  membership: OrganizationMember;
}

// Permisos que recibe el propietario al crear una organización.
const OWNER_PERMISSIONS: PermissionKey[] = [
  "users:read",
  "users:update",
  "users:delete",
  "roles:read",
  "roles:create",
  "roles:update",
  "roles:delete",
  "roles:assign",
];

export class CreateOrganizationWithOwnerService {
  constructor(
    private readonly database: TransactionalDatabase,
    private readonly organizationService: OrganizationService,
    private readonly roleService: RoleService,
    private readonly rolePermissionService: RolePermissionService,
    private readonly organizationMemberRepository: OrganizationMemberRepository,
  ) {}

  async execute(
    input: CreateOrganizationInput,
    userId: string,
  ): Promise<CreateOrganizationWithOwnerResult> {
    if (!userId?.trim()) {
      throw new ValidationError("Authenticated user ID is required");
    }

    return this.database.transaction(async (transaction) => {
      // 1. Crear la organización dentro de la transacción.
      const organization =
        await this.organizationService.createOrganization(
          input,
          transaction,
        );

      // 2. Crear el rol Owner dentro de la misma transacción.
      const ownerRole = await this.roleService.createRole(
        {
          organizationId: organization.id,
          name: "Owner",
          description: "Organization owner",
        },
        transaction,
      );

      // 3. Asignar los permisos al Owner usando esa transacción.
      await this.rolePermissionService.assignPermissions(
        ownerRole.id,
        OWNER_PERMISSIONS,
        transaction,
      );

      // 4. Registrar al usuario autenticado como propietario.
      const membership =
        await this.organizationMemberRepository.create(
          {
            userId,
            organizationId: organization.id,
            roleId: ownerRole.id,
          },
          transaction,
        );

      return {
        organization,
        ownerRole,
        membership,
      };
    });
  }
}
