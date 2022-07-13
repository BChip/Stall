import {
  addDoc,
  collection,
  doc,
  enableIndexedDbPersistence,
  getDocsFromCache,
  getDocsFromServer,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore"

import { isPastFiveMinutes, setLastFetch } from "~cachesettings"

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
  let querySnapshot = await getDocsFromCache(siteFeelingsQuery)
  // This only works if the site has data. So if a site has no siteFeelings, it will always ask the server.
  if (querySnapshot.empty || isPast) {
    querySnapshot = await getDocsFromServer(siteFeelingsQuery)
    setLastFetch(b64Url)
  }
  return querySnapshot.docs.map((doc) => doc.data())
}

export async function getComments(b64Url, sort) {
  const isPast = await isPastFiveMinutes(b64Url)
  const commentsRef = collection(db, "comments")
  const commentsQuery = query(
    commentsRef,
    where("url", "==", b64Url),
    where("hidden", "==", false),
    orderBy(sort, "desc")
  )
  // get from cache first, then from server
  let querySnapshot = await getDocsFromCache(commentsQuery)
  // This only works if the site has data. So if a site has no comments, it will always ask the server.
  if (querySnapshot.empty || isPast) {
    querySnapshot = await getDocsFromServer(commentsQuery)
    setLastFetch(b64Url)
  }
  return querySnapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id
  }))
}

export async function createComment(comment, user, b64Url) {
  await addDoc(collection(db, "comments"), {
    text: comment,
    user: doc(db, `users/${user.uid}`),
    url: b64Url,
    createdAt: serverTimestamp(),
    hidden: false
  })
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
}

export async function createCommentReport(reportReason, user, commentId) {
  const userRef = doc(db, `users/${user.id}`)
  const commentRef = doc(db, `comments/${commentId}`)
  await setDoc(doc(db, "commentReports", userRef.id + commentRef.id), {
    reportReason,
    comment: commentRef,
    user: userRef
  })
}
