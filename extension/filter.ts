import Filter from "bad-words"

const urlDomainRegex =
  /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/

let filter = new Filter()

export function filterComment(comment) {
  if (comment.match(urlDomainRegex)) {
    throw new Error("Please don't use Domains or URLs in comments.")
  }
  // filter swear words
  return filter.clean(comment)
}
