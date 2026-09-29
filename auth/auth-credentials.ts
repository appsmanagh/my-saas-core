//14. este es el model para la table AuthCredentials

export interface AuthCredentials {
  userId: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}