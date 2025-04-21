import React from 'react'
import { useRef } from 'react'
import { type EffectCallback, useEffect } from 'react'

export function useThrottleFn<T, U extends unknown[]>(
  fn: (...args: U) => T,
  ms: number,
  args: U,
) {
  const [state, setState] = React.useState<T | null>(null)
  const timeout = useRef<ReturnType<typeof setTimeout>>()
  const nextArgs = useRef<U>()

  // Store fn and ms in refs to avoid dependency issues
  const fnRef = useRef(fn)
  const msRef = useRef(ms)

  // Update refs when dependencies change
  useEffect(() => {
    fnRef.current = fn
    msRef.current = ms
  }, [fn, ms])

  // biome-ignore lint/correctness/useExhaustiveDependencies: args is spread in the dependency array
  useEffect(() => {
    if (!timeout.current) {
      setState(fnRef.current(...args))
      const timeoutCallback = () => {
        if (nextArgs.current) {
          setState(fnRef.current(...nextArgs.current))
          nextArgs.current = undefined
          timeout.current = setTimeout(timeoutCallback, msRef.current)
        } else {
          timeout.current = undefined
        }
      }
      timeout.current = setTimeout(timeoutCallback, msRef.current)
    } else {
      nextArgs.current = args
    }
  }, [...args])

  useUnmount(() => {
    timeout.current && clearTimeout(timeout.current)
  })

  return state
}

function useEffectOnce(effect: EffectCallback) {
  useEffect(effect, [])
}

function useUnmount(fn: () => void) {
  const fnRef = useRef(fn)

  // update the ref each render so if it change the newest callback will be invoked
  fnRef.current = fn

  useEffectOnce(() => () => fnRef.current())
}
