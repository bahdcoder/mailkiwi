import { makeValidator } from 'envalid'

export const redisDatabaseUrl = makeValidator((value) => {
  const regex = new RegExp(
    /^redis:\/\/(?:(?<user>[a-zA-Z0-9._-]*)(:(?<password>[a-zA-Z0-9._-]*))?@)?(?<host>[a-zA-Z0-9.-]+)(:(?<port>\d+))?(\/(?<db>\d*))?$/,
  )

  if (regex.test(value)) return value

  throw new Error('Invalid Redis database host provided.')
})
