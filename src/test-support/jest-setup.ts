const error = console.error

const throwError = function (message: string | Error, ...args: unknown[]) {
  error.apply(console, args) // keep default behaviour
  throw message instanceof Error ? message : new Error(message)
}

global.beforeEach(() => {
  console.warn = throwError
  console.error = throwError
})

export {}
