import { readFile } from 'node:fs/promises'
import https from 'node:https'
import { resolve } from 'node:path'
import { appEnv } from '#root/core/app/env/app_env.js'
import acme from 'acme-client'

export class AcmeCertificatesTool {
  private accountKey: Buffer | string
  private domain: string

  CERTIFICATES_CONTACT_EMAIL = 'certificates@kibamail.com'

  CERTIFICATES_CONTACT = [`mailto:${this.CERTIFICATES_CONTACT_EMAIL}`]

  forDomain(domain: string) {
    this.domain = domain

    return this
  }

  client() {
    return new acme.Client({
      directoryUrl: appEnv.isDev
        ? appEnv.ACME_DIRECTORY_URL
        : acme.directory.letsencrypt.production,
      accountKey: this.accountKey,
    })
  }

  setAccountKey(accountKey: Buffer | string) {
    this.accountKey = accountKey

    return this
  }

  csr() {
    return acme.forge.createCsr({ commonName: this.domain })
  }

  async accountPrivateKey() {
    return acme.forge.createPrivateKey()
  }

  async createAccount() {
    const accountPrivateKey = await this.accountPrivateKey()

    this.accountKey = accountPrivateKey

    if (appEnv.isDev || appEnv.isTest) {
      acme.axios.defaults.httpsAgent = new https.Agent({
        ca: await readFile(resolve('certs', 'pebble.minica.pem')),
      })
    }

    const account = await this.client().createAccount({
      termsOfServiceAgreed: true,
      contact: [`mailto:${this.CERTIFICATES_CONTACT_EMAIL}`],
    })

    return { accountPrivateKey, account }
  }
}
