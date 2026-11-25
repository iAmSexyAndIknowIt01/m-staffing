import { describe, expect, it } from "vitest"
import { MAX_PAGE_SIZE, parsePaging } from "./paging"

const p = (q: string) => parsePaging(new URLSearchParams(q))

describe("parsePaging", () => {
  it("анхдагч утга", () => {
    expect(p("")).toEqual({ limit: 20, offset: 0 })
    expect(parsePaging(new URLSearchParams(""), 10)).toEqual({ limit: 10, offset: 0 })
  })
  it("зөв утгыг уншина", () => {
    expect(p("limit=10&offset=30")).toEqual({ limit: 10, offset: 30 })
  })
  it("буруу, сөрөг, хэт их утгыг засна", () => {
    expect(p("limit=-5&offset=-1")).toEqual({ limit: 20, offset: 0 })
    expect(p("limit=abc&offset=x")).toEqual({ limit: 20, offset: 0 })
    expect(p("limit=5000").limit).toBe(MAX_PAGE_SIZE)
    expect(p("limit=7.9&offset=2.5")).toEqual({ limit: 7, offset: 2 })
  })
})
