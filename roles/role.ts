//26. esta es la entidad role
//44. se agrega la colum isSystem

//45. se agrega la column isOwner: boolean;, para proteger al ultimo propietario
export interface Role {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isOwner: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoleInput {
  organizationId: string;
  name: string;
  description?: string | null;
}

// Input interno utilizado por los repositorios.
export interface CreateRoleRecord extends CreateRoleInput {
  isSystem: boolean;
  isOwner: boolean;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string | null;
}