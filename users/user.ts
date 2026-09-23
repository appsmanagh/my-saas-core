//4. Este es el model de user
// modelo de dominio minimo

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}