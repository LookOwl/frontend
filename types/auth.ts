export type UserRole = "lector" | "bibliotecario";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthSession {
  accessToken: string;
  tokenType: string;
}

export interface JwtPayload {
  sub: string;
  exp: number;
  iat: number;
  iss: string;
  role: UserRole;
}
