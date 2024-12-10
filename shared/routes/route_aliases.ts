export const aliases = {
  welcome: "/w/welcome",

  // email/password registration
  auth_register: "/auth/register",
  auth_register_password: "/auth/register/password",
  auth_register_profile: "/auth/register/profile",
  auth_register_email_confirm: "/auth/register/email/confirm",

  // login
} as const

export function route(alias: keyof typeof aliases, routeParams?: Record<string, string>) {
  const path = aliases[alias]

  if (routeParams) {
    for (const [key, value] of Object.entries(routeParams)) {
      path.replace(`:${key}`, value)
    }
  }

  return path
}
