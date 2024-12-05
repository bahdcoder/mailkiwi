export const aliases = {
  welcome: "/welcome",

  // email/password registration
  auth_register: "/auth/register",
  auth_register_password: "/auth/register/password",
  auth_register_profile: "/auth/register/profile",
  auth_register_email_confirm: "/auth/register/email/confirm",

  // login
} as const

export function route(alias: keyof typeof aliases) {
  return aliases[alias]
}
