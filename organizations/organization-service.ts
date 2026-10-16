//30. este es organizations services
import { randomUUID } from "node:crypto";

import type {
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from "./organization";

import type { OrganizationRepository } from "./organization-repository";

import {
  ValidationError,
  NotFoundError,
  ConflictError,
} from "../errors";

export class OrganizationService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async createOrganization(
    input: CreateOrganizationInput,
  ): Promise<Organization> {
    const name = input.name?.trim();
    const slug = input.slug?.trim().toLowerCase();

    if (!name) {
      throw new ValidationError("Organization name is required");
    }

    if (!slug) {
      throw new ValidationError("Organization slug is required");
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new ValidationError(
        "Slug must contain lowercase letters, numbers, and single hyphens",
      );
    }

    const existing = await this.organizationRepository.findBySlug(slug);

    if (existing) {
      throw new ConflictError("Organization slug already exists");
    }

    return this.organizationRepository.create({
      name,
      slug,
    });
  }

  async getOrganizationById(id: string): Promise<Organization> {
    if (!id?.trim()) {
      throw new ValidationError("Organization ID is required");
    }

    const organization = await this.organizationRepository.findById(id);

    if (!organization) {
      throw new NotFoundError("Organization not found");
    }

    return organization;
  }

  async getOrganizationBySlug(slug: string): Promise<Organization> {
    const normalizedSlug = slug?.trim().toLowerCase();

    if (!normalizedSlug) {
      throw new ValidationError("Organization slug is required");
    }

    const organization =
      await this.organizationRepository.findBySlug(normalizedSlug);

    if (!organization) {
      throw new NotFoundError("Organization not found");
    }

    return organization;
  }

  async getAllOrganizations(): Promise<Organization[]> {
    return this.organizationRepository.findAll();
  }

  async updateOrganization(
    id: string,
    input: UpdateOrganizationInput,
  ): Promise<Organization> {
    if (!id?.trim()) {
      throw new ValidationError("Organization ID is required");
    }

    const updates: UpdateOrganizationInput = {};

    if (input.name !== undefined) {
      const name = input.name.trim();

      if (!name) {
        throw new ValidationError("Organization name cannot be empty");
      }

      updates.name = name;
    }

    if (input.slug !== undefined) {
      const slug = input.slug.trim().toLowerCase();

      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        throw new ValidationError("Invalid organization slug");
      }

      const existing = await this.organizationRepository.findBySlug(slug);

      if (existing && existing.id !== id) {
        throw new ConflictError("Organization slug already exists");
      }

      updates.slug = slug;
    }

    if (Object.keys(updates).length === 0) {
      throw new ValidationError("At least one field must be provided");
    }

    const updated = await this.organizationRepository.update(id, updates);

    if (!updated) {
      throw new NotFoundError("Organization not found");
    }

    return updated;
  }

  async deleteOrganization(id: string): Promise<void> {
    if (!id?.trim()) {
      throw new ValidationError("Organization ID is required");
    }

    const organization = await this.organizationRepository.findById(id);

    if (!organization) {
      throw new NotFoundError("Organization not found");
    }

    await this.organizationRepository.delete(id);
  }
}