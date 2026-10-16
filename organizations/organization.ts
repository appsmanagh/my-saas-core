
// 30. ¿Por qué tenemos slug? Es el identificador legible que podríamos usar después en URLs como /organizations/mi-empresa. 
// Lo mantendremos único para evitar ambigüedades.

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  slug?: string;
}