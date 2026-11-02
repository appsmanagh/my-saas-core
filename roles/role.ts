//26. esta es la entidad role
//44. se agrega la colum isSystem
export interface Role {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoleInput {
  organizationId: string;
  name: string;
  description?: string | null;
  isSystem?: boolean;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string | null;
}