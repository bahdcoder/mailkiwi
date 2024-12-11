function w(path: string) {
  return `/w/${path}`
}

export const aliases = {
  // email/password registration
  auth_register: "/auth/register",
  auth_register_password: "/auth/register/password",
  auth_register_profile: "/auth/register/profile",
  auth_register_email_confirm: "/auth/register/email/confirm",
  auth_passwords_forgot: "/auth/passwords/forgot",
  auth_passwords_reset: "/auth/passwords/reset/:token",

  // login
  auth_login: "/auth/login",

  // dashboard
  welcome: w("welcome"),
  dashboard: w("dashboard"),

  // community
  community: "community",

  // products
  letters: w("letters"),
  send: w("send"),
  optimise: w("optimise"),
  engage: w("engage"),
  insights: w("insights"),

  // error pages
  error_404: "/e/404",
  error_500: "/e/500",
} as const

export function route(alias: keyof typeof aliases, routeParams?: Record<string, string>) {
  let path = aliases[alias]

  console.log({ path, routeParams })

  if (routeParams) {
    for (const [key, value] of Object.entries(routeParams)) {
      path = path.replace(`:${key}`, value)
    }
  }

  return path
}

export function wRoute() {}
