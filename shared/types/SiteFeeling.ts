import type { DocumentReference } from "firebase/firestore"

export interface SiteFeeling {
  b64Url: string
  url: string
  like: boolean
  user: DocumentReference
}
