// A more flexible constructor type that can handle any parameters

// biome-ignore lint/suspicious/noExplicitAny: We need to use any here to support existing code
export type Constructor<T = unknown, Args extends any[] = any[]> = new (
  ...args: Args
) => T

export class Container {
  private instances: Map<string | Constructor, unknown> = new Map()
  private singletons: Map<string | Constructor, unknown> = new Map()
  private fakes: Map<string | Constructor, unknown> = new Map()
  private originalInstances: Map<string | Constructor, unknown> = new Map()
  private originalSingletons: Map<string | Constructor, unknown> = new Map()

  register<T>(key: string | Constructor<T>, value: T): void {
    this.instances.set(key, value)
  }

  registerInstance = this.register

  // biome-ignore lint/suspicious/noExplicitAny: We need to use any here to support existing code
  make<T>(key: string | Constructor<T>, ...args: any[]): T {
    if (this.fakes.has(key)) {
      return this.fakes.get(key) as T
    }

    if (typeof key === 'string') {
      if (!this.instances.has(key)) {
        throw new Error(`No instance registered for key: ${key}`)
      }
      return this.instances.get(key) as T
    }

    const instance = new key(...args)

    this.instances.set(key, instance)

    return instance
  }

  resolve = this.make

  // biome-ignore lint/suspicious/noExplicitAny: We need to use any here to support existing code
  singleton<T>(key: string | Constructor<T>, value?: T, ...args: any[]): T {
    if (this.fakes.has(key)) {
      return this.fakes.get(key) as T
    }

    if (this.singletons.has(key)) {
      return this.singletons.get(key) as T
    }

    let instance: T
    if (value) {
      instance = value
    } else if (typeof key === 'string') {
      instance = this.make(key)
    } else {
      instance = new key(...args)
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
    const keys = Array.from(this.fakes.keys())
    for (const key of keys) {
      this.restore(key)
    }
  }
}

export const container = new Container()
