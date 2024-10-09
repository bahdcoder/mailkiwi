type Constructor<T = unknown> = new (...args: any[]) => T

export class Container {
  private instances: Map<string | Constructor, any> = new Map()
  private singletons: Map<string | Constructor, any> = new Map()
  private fakes: Map<string | Constructor, any> = new Map()
  private originalInstances: Map<string | Constructor, any> = new Map()
  private originalSingletons: Map<string | Constructor, any> = new Map()

  register<T>(key: string | (new (...args: any[]) => T), value: T): void {
    this.instances.set(key, value)
  }

  registerInstance = this.register

  make<T>(key: string | (new (...args: any[]) => T)): T {
    if (this.fakes.has(key)) {
      return this.fakes.get(key)
    }

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
    if (this.fakes.has(key)) {
      return this.fakes.get(key)
    }

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

  fake<T>(key: string | Constructor<T>, fakeValue: T): void {
    if (this.instances.has(key)) {
      this.originalInstances.set(key, this.instances.get(key))
      this.instances.delete(key)
    }
    if (this.singletons.has(key)) {
      this.originalSingletons.set(key, this.singletons.get(key))
      this.singletons.delete(key)
    }
    this.fakes.set(key, fakeValue)
  }

  restore<T>(key: string | Constructor<T>): void {
    if (this.fakes.has(key)) {
      this.fakes.delete(key)
      if (this.originalInstances.has(key)) {
        this.instances.set(key, this.originalInstances.get(key))
        this.originalInstances.delete(key)
      }
      if (this.originalSingletons.has(key)) {
        this.singletons.set(key, this.originalSingletons.get(key))
        this.originalSingletons.delete(key)
      }
    }
  }

  restoreAll(): void {
    for (const key of this.fakes.keys()) {
      this.restore(key)
    }
  }
}

export const container = new Container()
