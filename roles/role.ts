//26. esta es la entidad role

export interface Role {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoleInput {
  organizationId: string;
  name: string;
  description?: string | null;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string | null;
}