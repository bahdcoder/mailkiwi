global.dump = (...values) => {
  console.dir([...values], { depth: null })
}

global.d = global.dump
