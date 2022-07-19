import { describe, expect, it } from "@jest/globals"

import abbreviate from "../abbreviate"

describe("abbreviates numbers", () => {
  it("should turn 5 into 5", () => {
    expect(abbreviate(5)).toBe("5")
  })
  it("should turn 1000 into 1M", () => {
    expect(abbreviate(1000)).toBe("1K")
  })
  it("should turn 1000000 into 1M", () => {
    expect(abbreviate(1000000)).toBe("1M")
  })
  it("should turn 1500000 into 1.5M", () => {
    expect(abbreviate(1500000)).toBe("1.5M")
  })
  it("should turn 1500000000 into 1.5B", () => {
    expect(abbreviate(1500000000)).toBe("1.5B")
  })
  it("should turn 1500000000000 into 1.5T", () => {
    expect(abbreviate(1500000000000)).toBe("1.5T")
  })
})
