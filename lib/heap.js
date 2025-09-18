function compare(a, b) {
  return a._expiry < b._expiry
    ? -1
    : a._expiry > b._expiry
      ? 1
      : a._id < b._id
        ? -1
        : a._id > b._id
          ? 1
          : 0
}

module.exports = class Heap {
  constructor() {
    this._data = []
  }

  get length() {
    return this._data.length
  }

  push(value) {
    value._index = this._data.length
    this._data.push(value)
    this._up(this._data.length - 1)
  }

  shift() {
    const data = this._data

    if (data.length === 0) return undefined

    const root = data[0]
    root._index = -1

    const last = data.pop()

    if (data.length > 0) {
      data[0] = last
      last._index = 0
      this._down(0)
    }

    return root
  }

  peek() {
    return this._data[0]
  }

  update(value) {
    const data = this._data
    const i = value._index

    if (i < 0 || i >= data.length) return

    if (i > 0) {
      const parent = ((i - 1) / 2) | 0

      if (compare(data[i], data[parent]) < 0) {
        return this._up(i)
      }
    }

    this._down(i)
  }

  _swap(i, j) {
    const data = this._data
    const value = data[i]

    data[i] = data[j]
    data[i]._index = i

    data[j] = value
    data[j]._index = j
  }

  _up(i) {
    const data = this._data

    while (i > 0) {
      const parent = ((i - 1) / 2) | 0

      if (compare(data[i], data[parent]) >= 0) break

      this._swap(i, parent)

      i = parent
    }
  }

  _down(i) {
    const data = this._data
    const length = data.length

    while (true) {
      const left = 2 * i + 1
      const right = 2 * i + 2

      let smallest = i

      if (left < length && compare(data[left], data[smallest]) < 0) {
        smallest = left
      }

      if (right < length && compare(data[right], data[smallest]) < 0) {
        smallest = right
      }

      if (smallest === i) break

      this._swap(i, smallest)

      i = smallest
    }
  }
}
