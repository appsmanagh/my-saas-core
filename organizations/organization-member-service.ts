//47. Este servicio será responsable de impedir que una organización se quede sin propietarios cuando alguien intente:
    // 1. Cambiar el rol del último Owner.
    // 2. Eliminar al último Owner.
import { ConflictError, NotFoundError, ValidationError } from "../errors";

import type { TransactionalDatabase } from "../database/transactional-database";

import type { OrganizationRepository } from "./organization-repository";
import type { OrganizationMember } from "./organization-member";
import type { OrganizationMemberRepository } from "./organization-member-repository";

import type { RoleRepository } from "../roles/role-repository";

export class OrganizationMemberService {
  constructor(
    private readonly database: TransactionalDatabase,
    private readonly organizationRepository: OrganizationRepository,
    private readonly memberRepository: OrganizationMemberRepository,
    private readonly roleRepository: RoleRepository,
  ) {}

  async changeMemberRole(
    userId: string,
    organizationId: string,
    newRoleId: string,
  ): Promise<OrganizationMember> {
    if (!userId.trim() || !organizationId.trim() || !newRoleId.trim()) {
      throw new ValidationError("User, organization and role IDs are required");
    }

    return this.database.transaction(async (transaction) => {
      const organization = await this.organizationRepository.lockById(
        organizationId,
        transaction,
      );

      if (!organization) {
        throw new NotFoundError("Organization not found");
      }

      const member = await this.memberRepository.findByUserAndOrganization(
        userId,
        organizationId,
        transaction
      );

      if (!member) {
        throw new NotFoundError("Organization member not found");
      }

      const currentRole = await this.roleRepository.findById(member.roleId,transaction);

      if (!currentRole || currentRole.organizationId !== organizationId) {
        throw new ConflictError("Member has an invalid role");
      }

      const newRole = await this.roleRepository.findById(newRoleId,transaction);

      if (!newRole || newRole.organizationId !== organizationId) {
        throw new ValidationError("Role does not belong to this organization");
      }

      if (currentRole.isOwner && !newRole.isOwner) {
        const ownerCount =
          await this.memberRepository.countOwnersByOrganization(
            organizationId,
            transaction,
          );

        if (ownerCount <= 1) {
          throw new ConflictError(
            "Cannot remove the last owner of an organization",
          );
        }
      }

      const updated = await this.memberRepository.updateRole(
        userId,
        organizationId,
        newRoleId,
        transaction,
      );

      if (!updated) {
        throw new NotFoundError("Organization member not found");
      }

      return updated;
    });
  }

  async removeMember(
    userId: string,
    organizationId: string,
  ): Promise<void> {
    if (!userId.trim() || !organizationId.trim()) {
      throw new ValidationError("User and organization IDs are required");
    }

    await this.database.transaction(async (transaction) => {
      const organization = await this.organizationRepository.lockById(
        organizationId,
        transaction,
      );

      if (!organization) {
        throw new NotFoundError("Organization not found");
      }

      const member = await this.memberRepository.findByUserAndOrganization(
        userId,
        organizationId,
        transaction
      );

      if (!member) {
        throw new NotFoundError("Organization member not found");
      }

      const currentRole = await this.roleRepository.findById(member.roleId,transaction);

      if (!currentRole || currentRole.organizationId !== organizationId) {
        throw new ConflictError("Member has an invalid role");
      }

      if (currentRole.isOwner) {
        const ownerCount =
          await this.memberRepository.countOwnersByOrganization(
            organizationId,
            transaction,
          );

        if (ownerCount <= 1) {
          throw new ConflictError(
            "Cannot remove the last owner of an organization",
          );
        }
      }

      await this.memberRepository.delete(
        userId,
        organizationId,
        transaction,
      );
    });
  }
}
