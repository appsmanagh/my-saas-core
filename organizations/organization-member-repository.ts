// 35. ¿Por qué incluimos estos métodos?
// Método	Propósito
// create	Añadir un usuario a una organización.
// findByUserAndOrganization	Consultar su membresía y rol para autorizar peticiones.
// findByOrganization	Obtener los miembros de una organización.
// updateRole	Cambiar el rol de un miembro.
// delete	Retirar la membresía.


import type {
  OrganizationMember,
  CreateOrganizationMemberInput,
} from "./organization-member";

export interface OrganizationMemberRepository {
  create(
    input: CreateOrganizationMemberInput,
  ): Promise<OrganizationMember>;

  findByUserAndOrganization(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationMember | null>;

  findByOrganization(
    organizationId: string,
  ): Promise<OrganizationMember[]>;

  updateRole(
    userId: string,
    organizationId: string,
    roleId: string,
  ): Promise<OrganizationMember | null>;

  delete(
    userId: string,
    organizationId: string,
  ): Promise<void>;
}
