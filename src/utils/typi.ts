type Constructor<T = unknown> = new (...args: any[]) => T

export class Container {
  private instances: Map<string | Constructor, any> = new Map()
  private singletons: Map<string | Constructor, any> = new Map()

  register<T>(key: string | (new (...args: any[]) => T), value: T): void {
    this.instances.set(key, value)
  }

  registerInstance = this.register

  make<T>(key: string | (new (...args: any[]) => T)): T {
    if (typeof key === "string") {
      if (!this.instances.has(key)) {
        throw new Error(`No instance registered for key: ${key}`)
      }
      return this.instances.get(key)
    }

    if (this.instances.has(key)) {
      const instance = this.instances.get(key)

      return new instance()
    }

    return new key()
  }

  resolve = this.make

  singleton<T>(
    key: string | (new (...args: unknown[]) => T),
    value?: T,
  ): T {
    if (this.singletons.has(key)) {
      return this.singletons.get(key)
    }

    let instance: T
    if (value) {
      instance = value
    } else if (typeof key === "string") {
      instance = this.make(key)
    } else {
      instance = new key()
    }

    this.singletons.set(key, instance)
    return instance
  }
}

export const container = new Container()
