//26. esta es la entidad permmision

export interface Permission {
  id: string;
  key: string;
  description: string;
  createdAt: Date;
}

// Permission keys are stable identifiers used by the application.
export const PERMISSION_KEYS = {
  USERS_READ: "users:read",
  USERS_UPDATE: "users:update",
  USERS_DELETE: "users:delete",
  ROLES_READ: "roles:read",
  ROLES_CREATE: "roles:create",
  ROLES_UPDATE: "roles:update",
  ROLES_DELETE: "roles:delete",
  ROLES_ASSIGN: "roles:assign",
} as const;

export type PermissionKey =
  (typeof PERMISSION_KEYS)[keyof typeof PERMISSION_KEYS];