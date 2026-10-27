
import { ConflictError } from "../../errors";
import type {
  OrganizationMember,
  CreateOrganizationMemberInput,
} from "../organization-member";
import type { OrganizationMemberRepository } from "../organization-member-repository";

export class InMemoryOrganizationMemberRepository
  implements OrganizationMemberRepository
{
  private readonly members = new Map<string, OrganizationMember>();

  private getKey(userId: string, organizationId: string): string {
    return `${organizationId}:${userId}`;
  }

  async create(
    input: CreateOrganizationMemberInput,
  ): Promise<OrganizationMember> {
    const key = this.getKey(input.userId, input.organizationId);

    if (this.members.has(key)) {
      throw new ConflictError("User is already a member of this organization");
    }

    const member: OrganizationMember = {
      ...input,
      createdAt: new Date(),
    };

    this.members.set(key, member);
    return member;
  }

  async findByUserAndOrganization(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationMember | null> {
    return this.members.get(this.getKey(userId, organizationId)) ?? null;
  }

  async findByUser(userId: string): Promise<OrganizationMember[]> {
    return [...this.members.values()].filter(
      (member) => member.userId === userId,
    );
  }

  async findByOrganization(
    organizationId: string,
  ): Promise<OrganizationMember[]> {
    return [...this.members.values()].filter(
      (member) => member.organizationId === organizationId,
    );
  }

  async updateRole(
    userId: string,
    organizationId: string,
    roleId: string,
  ): Promise<OrganizationMember | null> {
    const key = this.getKey(userId, organizationId);
    const member = this.members.get(key);

    if (!member) {
      return null;
    }

    const updated: OrganizationMember = { ...member, roleId };
    this.members.set(key, updated);
    return updated;
  }

  async delete(userId: string, organizationId: string): Promise<void> {
    this.members.delete(this.getKey(userId, organizationId));
  }
}
