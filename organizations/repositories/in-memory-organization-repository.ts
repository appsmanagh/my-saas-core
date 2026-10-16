
//30. este es el file de organization repository pero en memory 

import { randomUUID } from "node:crypto";

import type {
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from "./organization";

import type { OrganizationRepository } from "./organization-repository";

export class InMemoryOrganizationRepository
  implements OrganizationRepository
{
  private readonly organizations = new Map<string, Organization>();

  async create(input: CreateOrganizationInput): Promise<Organization> {
    const now = new Date();

    const organization: Organization = {
      id: randomUUID(),
      name: input.name,
      slug: input.slug,
      createdAt: now,
      updatedAt: now,
    };

    this.organizations.set(organization.id, organization);

    return organization;
  }

  async findById(id: string): Promise<Organization | null> {
    return this.organizations.get(id) ?? null;
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    for (const organization of this.organizations.values()) {
      if (organization.slug === slug) {
        return organization;
      }
    }

    return null;
  }

  async findAll(): Promise<Organization[]> {
    return [...this.organizations.values()];
  }

  async update(
    id: string,
    input: UpdateOrganizationInput,
  ): Promise<Organization | null> {
    const organization = this.organizations.get(id);

    if (!organization) {
      return null;
    }

    const updated: Organization = {
      ...organization,
      ...input,
      updatedAt: new Date(),
    };

    this.organizations.set(id, updated);

    return updated;
  }

  async delete(id: string): Promise<void> {
    this.organizations.delete(id);
  }
}