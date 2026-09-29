import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(cleanup)

// jsdom has no layout, so it can't scroll: an element's scrollTo only records where it was asked to go.
// (Tests that run in plain Node, like the build stamp's, have no elements at all.)
if (typeof Element !== 'undefined') {
  Element.prototype.scrollTo = function (this: Element, options?: ScrollToOptions | number) {
    if (typeof options === 'object') this.scrollLeft = options.left ?? this.scrollLeft
  }
}
