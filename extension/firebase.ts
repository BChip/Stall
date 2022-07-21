import {
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

import { isPastFiveMinutes, setLastFetch } from "./cachesettings"
import { db } from "./config"

enableIndexedDbPersistence(db).catch((err) => {
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

export async function getSiteFeelings(b64Url) {
  const isPast = await isPastFiveMinutes(b64Url)
  const siteFeelings = collection(db, "siteFeelings")
  const siteFeelingsQuery = query(siteFeelings, where("url", "==", b64Url))
  // get from cache first, then from server
  let querySnapshot
  try {
    querySnapshot = await getDocsFromCache(siteFeelingsQuery)
  } catch (err) {}

  // This only works if the site has data. So if a site has no siteFeelings, it will always ask the server.
  if (!querySnapshot || querySnapshot.empty || isPast) {
    querySnapshot = await getDocs(siteFeelingsQuery)
    await setLastFetch(b64Url)
  }
  return querySnapshot.docs.map((doc) => doc.data())
}

export async function getComments(
  b64Url,
  sort,
  lastVisible = null,
  limitNum = 10
) {
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
  if (!querySnapshot || querySnapshot.empty || isPast) {
    querySnapshot = await getDocs(commentsQuery)
    await setLastFetch(b64Url)
  }
  return querySnapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
    doc: doc
  }))
}

export async function createComment(comment: string, user, b64Url: string) {
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

export async function deleteComment(commentId) {
  await updateDoc(doc(db, "comments", commentId), {
    hidden: true
  })
}

export async function updateComment(commentId, comment) {
  await updateDoc(doc(db, "comments", commentId), {
    text: comment,
    updatedAt: serverTimestamp()
  })
}

export async function createSiteFeeling(feeling, user, b64Url) {
  const userRef = doc(db, `users/${user.uid}`)
  await setDoc(doc(db, "siteFeelings", userRef.id + b64Url), {
    url: b64Url,
    user: userRef,
    like: feeling
  })
  await updateUserLastTransaction(user.uid)
}

export async function createCommentReport(reportReason, user, commentId) {
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

export async function getUser(user, b64Url) {
  const isPast = await isPastFiveMinutes(b64Url)
  // get from cache first, then from server
  let docSnap
  try {
    docSnap = await getDocFromCache(user)
  } catch (err) {}
  // This only works if the site has data. So if a site has no siteFeelings, it will always ask the server.
  if (!docSnap || !docSnap.exists() || isPast) {
    docSnap = await getDoc(user)
    await setLastFetch(b64Url)
  }
  if (docSnap.exists()) {
    const userData = docSnap.data()
    return userData
  }
}
