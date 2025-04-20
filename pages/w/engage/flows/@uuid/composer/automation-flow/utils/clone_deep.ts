/**
 * A strongly typed, high-performance alternative to Lodash's cloneDeep function.
 * Handles all JavaScript value types and complex object structures including:
 * - Primitive values
 * - Objects and nested objects
 * - Arrays and typed arrays
 * - Dates
 * - RegExp objects
 * - Map and Set collections
 * - Functions (reference maintained)
 * - Circular references
 * - Symbol properties
 * - Non-enumerable properties
 * - Inherited properties (optional)
 * - DOM elements (reference maintained)
 * - WeakMap and WeakSet (reference maintained)
 */

/**
 * Type definition for any JavaScript value
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic cloning function needs to handle any type
type Cloneable = any

/**
 * Options for the deepClone function
 */
interface DeepCloneOptions {
  /**
   * Whether to preserve the prototype chain in cloned objects
   * @default false
   */
  preservePrototype?: boolean

  /**
   * Whether to copy non-enumerable properties
   * @default false
   */
  copyNonEnumerable?: boolean

  /**
   * Maximum depth to clone (prevents stack overflow for deeply nested structures)
   * @default Infinity
   */
  maxDepth?: number
}

/**
 * Creates a deep clone of the provided value
 * @param value - The value to clone
 * @param options - Cloning options
 * @returns A deep clone of the original value
 */
export function deepClone<T extends Cloneable>(
  value: T,
  options: DeepCloneOptions = {},
): T {
  const {
    preservePrototype = false,
    copyNonEnumerable = false,
    maxDepth = Number.POSITIVE_INFINITY,
  } = options

  // Use a WeakMap to track objects we've already cloned to handle circular references
  // biome-ignore lint/suspicious/noExplicitAny: WeakMap needs to store any cloned value type
  const cloneCache = new WeakMap<object, any>()

  /**
   * Inner recursive clone function with depth tracking
   */
  function clone<U extends Cloneable>(value: U, depth: number): U {
    // Base case for maximum depth
    if (depth > maxDepth) {
      return value
    }

    // Handle primitive values (null, undefined, boolean, number, string, symbol, bigint)
    if (value === null || value === undefined || typeof value !== 'object') {
      return value
    }

    // Special case for functions - we don't clone them, just return the reference
    if (typeof value === 'function') {
      return value
    }

    // Handle DOM nodes (return reference without cloning)
    if (value instanceof Node) {
      return value
    }

    // Check if we've already cloned this object (circular reference)
    if (cloneCache.has(value as object)) {
      return cloneCache.get(value as object)
    }

    // Date objects
    if (value instanceof Date) {
      return new Date(value.getTime()) as unknown as U
    }

    // RegExp objects
    if (value instanceof RegExp) {
      return new RegExp(value.source, value.flags) as unknown as U
    }

    // ArrayBuffer
    if (value instanceof ArrayBuffer) {
      const clonedBuffer = value.slice(0)
      return clonedBuffer as unknown as U
    }

    // Typed Arrays
    if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
      const typedArray = value as unknown as TypedArray
      // Get the constructor (Uint8Array, Float32Array, etc.)
      const TypedArrayConstructor = typedArray.constructor as TypedArrayConstructor
      // Create a new instance with the same buffer section
      return new TypedArrayConstructor(
        typedArray.buffer.slice(
          typedArray.byteOffset,
          typedArray.byteOffset + typedArray.byteLength,
        ),
      ) as unknown as U
    }

    // DataView
    if (value instanceof DataView) {
      const buffer = value.buffer.slice(0)
      return new DataView(buffer) as unknown as U
    }

    // Maps
    if (value instanceof Map) {
      const clonedMap = new Map()
      cloneCache.set(value as object, clonedMap)

      value.forEach((val, key) => {
        // Clone both keys and values
        clonedMap.set(
          typeof key === 'object' && key !== null ? clone(key, depth + 1) : key,
          clone(val, depth + 1),
        )
      })

      return clonedMap as unknown as U
    }

    // Sets
    if (value instanceof Set) {
      const clonedSet = new Set()
      cloneCache.set(value as object, clonedSet)

      for (const val of value) {
        clonedSet.add(clone(val, depth + 1))
      }

      return clonedSet as unknown as U
    }

    // WeakMap, WeakSet - can't be cloned properly, return as-is
    if (value instanceof WeakMap || value instanceof WeakSet) {
      return value
    }

    // Arrays
    if (Array.isArray(value)) {
      // biome-ignore lint/suspicious/noExplicitAny: Array needs to store any cloned value type
      const clonedArray: any[] = []
      cloneCache.set(value as unknown as object, clonedArray)

      for (let i = 0; i < value.length; i++) {
        clonedArray[i] = clone(value[i], depth + 1)
      }

      return clonedArray as unknown as U
    }

    // Create the target object, preserving the prototype chain if specified
    const clonedObj = preservePrototype
      ? Object.create(Object.getPrototypeOf(value))
      : Object.create(null)

    // Cache the clone before populating it to handle circular references
    cloneCache.set(value as object, clonedObj)

    // Get property descriptors - includes non-enumerable properties if specified
    const descriptors = copyNonEnumerable
      ? Object.getOwnPropertyDescriptors(value)
      : getEnumerableDescriptors(value as object)

    // Copy all properties using descriptors
    for (const [key, descriptor] of Object.entries(descriptors)) {
      // Clone property value if it's a data descriptor
      if ('value' in descriptor) {
        descriptor.value = clone(descriptor.value, depth + 1)
      }

      // Define the property with the same attributes (enumerable, configurable, writable)
      Object.defineProperty(clonedObj, key, descriptor)
    }

    // Handle symbol properties
    const symbolProperties = Object.getOwnPropertySymbols(value)
    for (const sym of symbolProperties) {
      const descriptor = Object.getOwnPropertyDescriptor(value, sym) ?? {
        configurable: true,
        enumerable: true,
      }

      if ('value' in descriptor) {
        descriptor.value = clone(descriptor.value, depth + 1)
      }

      Object.defineProperty(clonedObj, sym, descriptor)
    }

    return clonedObj as U
  }

  return clone(value, 0)
}

/**
 * Gets all enumerable property descriptors of an object
 */
function getEnumerableDescriptors(obj: object): PropertyDescriptorMap {
  const descriptors: PropertyDescriptorMap = {}

  for (const key of Object.keys(obj)) {
    const descriptor = Object.getOwnPropertyDescriptor(obj, key)
    if (descriptor) {
      descriptors[key] = descriptor
    }
  }

  return descriptors
}

// Type definitions for TypedArrays for better type safety
type TypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | BigInt64Array
  | BigUint64Array

type TypedArrayConstructor = {
  new (buffer: ArrayBuffer | SharedArrayBuffer): TypedArray
  new (buffer: ArrayBuffer | SharedArrayBuffer, byteOffset: number): TypedArray
  new (
    buffer: ArrayBuffer | SharedArrayBuffer,
    byteOffset: number,
    length: number,
  ): TypedArray
  new (length: number): TypedArray
  new (array: ArrayLike<number> | ArrayLike<bigint>): TypedArray
}

// Export a convenient function with default options for direct replacement of lodash.cloneDeep
export const cloneDeep = <T>(value: T): T => deepClone(value)
