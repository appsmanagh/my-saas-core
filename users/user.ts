//4. Este es el model de user
// modelo de dominio minimo
//usuario ya creado

//12. se agrego este UserStatus y la column status 
export type UserStatus = "active" | "inactive";

export interface User {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

//5. datos necesarios para crear uno
export interface CreateUserInput {
  email: string;
  name: string;
}