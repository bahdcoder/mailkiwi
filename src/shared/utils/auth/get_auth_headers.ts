export function getAuthenticationHeaders(
  accessKey: string,
  accessSecret: string,
) {
  return {
    [accessKeyHeaderName()]: accessKey,
    [accessSecretHeaderName()]: accessSecret,
  }
}

export function accessKeyHeaderName() {
  return "x-kibamail-access-key"
}

export function accessSecretHeaderName() {
  return "x-kibamail-access-secret"
}
