import { makeValidator } from 'envalid'

export const mysqlDatabaseUrl = makeValidator((value) => {
  const regex = new RegExp(
    /^mysql:\/\/(?<user>[a-zA-Z0-9._-]+)(:(?<password>[a-zA-Z0-9._-]+))?@(?<host>[a-zA-Z0-9.-]+)(:(?<port>\d+))?\/(?<database>[a-zA-Z0-9._-]+)$/,
  )

  if (regex.test(value)) return value

  throw new Error('Invalid Mysql database host provided.')
})
