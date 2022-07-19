// convert a number to a short string representation
function abbreviate(num: number, fixed = 0): string {
  if (num === 0) {
    return "0"
  } // terminate early
  fixed = !fixed || fixed < 0 ? 0 : fixed // number of decimal places to show
  const b = num.toPrecision(2).split("e"), // get power
    k =
      b.length === 1
        ? 0
        : Math.floor(Math.min(Number((b[1] ?? "0").slice(1)), 14) / 3), // floor at decimals, ceiling at trillions
    c =
      k < 1
        ? num.toFixed(0 + fixed)
        : (num / Math.pow(10, k * 3)).toFixed(1 + fixed), // divide by power
    d = Number(c) < 0 ? c : Math.abs(Number(c)), // enforce -0 is 0
    e = String(d) + String(["", "K", "M", "B", "T"][k]) // append power
  return e
}

export default abbreviate
