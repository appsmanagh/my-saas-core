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


  //47. este method recibira transacion, para transactio support

 findByUserAndOrganization(
    userId: string,
    organizationId: string,
    transaction?: DatabaseTransaction,
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

  //46. method para ver users con role owner
//   Porque necesitamos que estas operaciones sucedan dentro de una misma transacción:
// 1. Bloquear la organización (lockById).
// 2. Consultar cuántos propietarios existen.
// 3. Comprobar que no estamos eliminando al último.
// 4. Cambiar el rol o eliminar la membresía.
// Así evitamos que dos solicitudes concurrentes eliminen simultáneamente a los dos últimos propietarios.
  countOwnersByOrganization(
    organizationId: string,
    transaction: DatabaseTransaction,
  ): Promise<number>;
}

 