import { ZCall } from "./z-call.js"

const api = new ZCall()

export interface LoginCredentials {
  email: string
  password: string
}

export interface ErrorResponse {
  message: string
  errors?: { message: string }[]
}

export interface LoginResponse {
  accessToken: {
    token: string
  }
}

export const login = <T>(credentials: LoginCredentials) =>
  api.post<T>("auth/login", credentials)
