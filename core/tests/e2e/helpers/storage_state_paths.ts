import { resolve } from 'node:path'

export const basePath = resolve('core', 'tests', 'e2e', 'state')

export function owner() {
  return resolve(basePath, 'auth.owner.json')
}

export function author() {
  return resolve(basePath, 'auth.author.json')
}

export function administrator() {
  return resolve(basePath, 'auth.administrator.json')
}

export function manager() {
  return resolve(basePath, 'auth.manager.json')
}

export function guest() {
  return resolve(basePath, 'auth.guest.json')
}
