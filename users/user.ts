//4. Este es el model de user
// modelo de dominio minimo
//usuario ya creado

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

//5. datos necesarios para crear uno
export interface CreateUserInput {
  email: string;
  name: string;
}