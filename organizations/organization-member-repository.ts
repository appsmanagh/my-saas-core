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

import type { DatabaseTransaction } from "../database/transactional-database";

export interface OrganizationMemberRepository {

  //36. se agrego transaction?: DatabaseTransaction, a esta funcion para transaction support organization+rolowner+permissions+membresia
  create(
    input: CreateOrganizationMemberInput,
    transaction?: DatabaseTransaction,
  ): Promise<OrganizationMember>;

  findByUserAndOrganization(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationMember | null>;

//40. se agrega este metodo para llamar a las organization del usuario logueado
  findByUser(
    userId: string,
  ): Promise<OrganizationMember[]>;

  findByOrganization(
    organizationId: string,
  ): Promise<OrganizationMember[]>;

  //45. se permite que el metodo pueda recibir transaction
  updateRole(
    userId: string,
    organizationId: string,
    roleId: string,
    transaction?: DatabaseTransaction,
  ): Promise<OrganizationMember | null>;

  //45. se permite que el metodo pueda recibir transaction
  delete(
    userId: string,
    organizationId: string,
    transaction?: DatabaseTransaction,
  ): Promise<void>;
}

 