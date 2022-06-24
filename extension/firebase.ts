import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where
} from "firebase/firestore"

import { db } from "./config"

export async function getSiteFeelings(siteRef) {
  const siteFeelings = collection(db, "siteFeelings")
  const siteFeelingsQuery = query(siteFeelings, where("url", "==", siteRef))
  try {
    const querySnapshot = await getDocs(siteFeelingsQuery)
    return querySnapshot.docs.map((doc) => doc.data())
  } catch (error) {
    console.log(error)
  }
}

export async function getComments(siteRef, sort) {
  const commentsRef = collection(db, "comments")
  const commentsQuery = query(
    commentsRef,
    where("url", "==", siteRef),
    orderBy(sort, "desc")
  )
  try {
    const querySnapshot = await getDocs(commentsQuery)
    return querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id
    }))
  } catch (error) {
    console.log(error)
  }
}

export async function createSite(tabUrl, b64Url) {
  await setDoc(doc(db, "sites", b64Url), {
    url: tabUrl
  })
}

export async function createComment(comment, user, siteRef) {
  try {
    await addDoc(collection(db, "comments"), {
      text: comment,
      author: doc(db, `users/${user.uid}`),
      url: siteRef,
      createdAt: serverTimestamp()
    })
  } catch (e) {
    console.error("Error adding document: ", e)
  }
}

export async function createSiteFeeling(feeling, user, siteRef) {
  const userRef = doc(db, `users/${user.uid}`)
  await setDoc(doc(db, "siteFeelings", userRef.id + siteRef.id), {
    url: siteRef,
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
    reportedBy: userRef
  })
}
