/* eslint-disable @typescript-eslint/no-explicit-any */

type Constructor<T = unknown> = new (...args: any[]) => T

export class Container {
  private instances: Map<string | Constructor, any> = new Map()
  private singletons: Map<string | Constructor, any> = new Map()

  register<T>(key: string | (new (...args: any[]) => T), value: T): void {
    this.instances.set(key, value)
  }

  registerInstance = this.register

  make<T>(key: string | (new (...args: any[]) => T)): T {
    if (typeof key === 'string') {
      if (!this.instances.has(key)) {
        throw new Error(`No instance registered for key: ${key}`)
      }
      return this.instances.get(key)
    }

    if (this.instances.has(key)) {
      const instance = this.instances.get(key)

      return new instance()
    }
    // Support for making arbitrary classes
    return new key()
  }

  resolve = this.make

  singleton<T>(key: string | (new (...args: unknown[]) => T), value?: T): T {
    if (this.singletons.has(key)) {
      return this.singletons.get(key)
    }

    let instance: T
    if (value) {
      instance = value
    } else if (typeof key === 'string') {
      instance = this.make(key)
    } else {
      instance = new key()
    }

    this.singletons.set(key, instance)
    return instance
  }
}

export const container = new Container()

// Register instances
// container.register("config", { apiKey: "12345" })
// container.register(ExampleClass, ExampleClass)

// // Make instances
// const config = container.make<{ apiKey: string }>("config")
// console.log(config.apiKey) // Output: 12345

// const example1 = container.make(ExampleClass)
// console.log(example1.name) // Output: Default

// const example2 = container.make(ExampleClass)
// console.log(example2 !== example1) // Output: true (new instance)

// // Make an arbitrary class that wasn't registered
// const arbitrary = container.make(ArbitraryClass)
// console.log(arbitrary instanceof ArbitraryClass) // Output: true

// console.log({ arbitrary })

// // Singleton usage
// const singleton1 = container.singleton(
//   ExampleClass,
//   new ExampleClass("Singleton"),
// )
// const singleton2 = container.singleton(ExampleClass)
// console.log(singleton1 === singleton2) // Output: true (same instance)
// console.log(singleton1.name) // Output: Singleton

// // Singleton with arbitrary class
// const arbitrarySingleton1 = container.singleton(ArbitraryClass)
// const arbitrarySingleton2 = container.singleton(ArbitraryClass)
// console.log(arbitrarySingleton1 === arbitrarySingleton2) // Output: true (same instance)
// console.log(arbitrarySingleton1 instanceof ArbitraryClass) // Output: true
