import {
  DocumentData,
  DocumentReference,
  addDoc,
  collection,
  doc,
  enableIndexedDbPersistence,
  getDoc,
  getDocFromCache,
  getDocs,
  getDocsFromCache,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where
} from "firebase/firestore"

import type { Site } from "~Site"
import type { SiteFeeling } from "~SiteFeeling"
import type { Comment } from "~components/comment"

import type { User } from "../../shared/types/User"
import { db } from "../config"
import { isPastFiveMinutes, setLastFetch } from "../utilities/cachesettings"

enableIndexedDbPersistence(db).catch((err: unknown) => {
  if (err.code == "failed-precondition") {
    // Multiple tabs open, persistence can only be enabled
    // in one tab at a a time.
    // ...
  } else if (err.code == "unimplemented") {
    // The current browser does not support all of the
    // features required to enable persistence
    // ...
  }
})
// Subsequent queries will use persistence, if it was enabled successfully

export async function getSite(
  b64Url: string,
  force = false
): Promise<Site | null> {
  let sitesData = null
  const isPast = await isPastFiveMinutes(b64Url)
  const sitesRef = doc(db, "sites", b64Url)
  // get from cache first, then from server
  let docSnap
  try {
    docSnap = await getDocFromCache(sitesRef)
  } catch (err) {}
  // This only works if the site has data. So if a site has no siteFeelings, it will always ask the server.
  if (isPast || force) {
    docSnap = await getDoc(sitesRef)
    await setLastFetch(b64Url)
  }
  if (docSnap?.exists()) {
    sitesData = docSnap.data() as Site
  }
  return sitesData
}

export async function getUserLiked(
  user: User,
  b64Url: string,
  force = false
): Promise<SiteFeeling | null> {
  let siteFeelingsData = null
  const isPast = await isPastFiveMinutes(b64Url)
  const siteFeelingRef = doc(db, "siteFeelings", user.uid + b64Url)
  // get from cache first, then from server
  let docSnap
  try {
    docSnap = await getDocFromCache(siteFeelingRef)
  } catch (err) {}
  // This only works if the site has data. So if a site has no siteFeelings, it will always ask the server.
  if (isPast || force) {
    docSnap = await getDoc(siteFeelingRef)
    //await setLastFetch(b64Url)
  }
  if (docSnap?.exists()) {
    siteFeelingsData = docSnap.data() as SiteFeeling
  }
  return siteFeelingsData
}

export async function getComments(
  b64Url: string,
  sort: string,
  lastVisible: DocumentData | null = null,
  limitNum = 10
): Promise<Comment[]> {
  const isPast = await isPastFiveMinutes(b64Url)
  const commentsRef = collection(db, "comments")
  let commentsQuery
  if (lastVisible) {
    commentsQuery = query(
      commentsRef,
      where("url", "==", b64Url),
      where("hidden", "==", false),
      orderBy(sort, "desc"),
      startAfter(lastVisible.doc),
      limit(limitNum)
    )
  } else {
    commentsQuery = query(
      commentsRef,
      where("url", "==", b64Url),
      where("hidden", "==", false),
      orderBy(sort, "desc"),
      limit(limitNum)
    )
  }

  // get from cache first, then from server
  let querySnapshot
  try {
    querySnapshot = await getDocsFromCache(commentsQuery)
  } catch (err) {}

  // This only works if the site has data. So if a site has no comments, it will always ask the server.
  if (isPast) {
    querySnapshot = await getDocs(commentsQuery)
    //await setLastFetch(b64Url)
  }
  return querySnapshot?.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
    doc: doc
  })) as unknown as Comment[]
}

export async function createComment(
  comment: string,
  user: User,
  b64Url: string
) {
  const newComment = await addDoc(collection(db, "comments"), {
    text: comment,
    user: doc(db, `users/${user.uid}`),
    url: b64Url,
    createdAt: serverTimestamp(),
    hidden: false
  })
  if (newComment.id) {
    await updateUserLastTransaction(user.uid)
  }
}

export async function deleteComment(commentId: string) {
  await updateDoc(doc(db, "comments", commentId), {
    hidden: true
  })
}

export async function updateComment(commentId: string, comment: string) {
  await updateDoc(doc(db, "comments", commentId), {
    text: comment,
    updatedAt: serverTimestamp()
  })
}

export async function createSiteFeeling(
  feeling: boolean,
  user: User,
  b64Url: string,
  url: string
) {
  const userRef = doc(db, `users/${user.uid}`)
  await setDoc(doc(db, "siteFeelings", userRef.id + b64Url), {
    b64Url: b64Url,
    url: url,
    user: userRef,
    like: feeling
  })
  await updateUserLastTransaction(user.uid)
}

export async function createCommentReport(
  reportReason: string,
  user: User,
  commentId: string
) {
  const userRef = doc(db, `users/${user.uid}`)
  const commentRef = doc(db, `comments/${commentId}`)
  await setDoc(doc(db, "commentReports", userRef.id + commentRef.id), {
    reportReason,
    comment: commentRef,
    user: userRef
  })
  await updateUserLastTransaction(user.uid)
}

export async function updateUserLastTransaction(userId: string) {
  await updateDoc(doc(db, "users", userId), {
    timeout: serverTimestamp()
  })
}

export async function getUser(userDoc: DocumentReference, b64Url: string) {
  const isPast = await isPastFiveMinutes(b64Url)
  // get from cache first, then from server
  let docSnap
  try {
    docSnap = await getDocFromCache(userDoc)
  } catch (err) {}
  // This only works if the site has data. So if a site has no siteFeelings, it will always ask the server.
  if (isPast) {
    docSnap = await getDoc(userDoc)
    //await setLastFetch(b64Url)
  }
  if (docSnap?.exists()) {
    const userData = docSnap.data()
    return userData
  }
  return null
}
