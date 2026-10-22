//35. Este modelo representa la relación entre un usuario, una organización y su rol. 
// No contiene los permisos directamente: esos se obtienen a través de role_permissions.
export interface OrganizationMember {
  userId: string;
  organizationId: string;
  roleId: string;
  createdAt: Date;
}

export interface CreateOrganizationMemberInput {
  userId: string;
  organizationId: string;
  roleId: string;
}
