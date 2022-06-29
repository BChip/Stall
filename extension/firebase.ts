import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore"

import { db } from "./config"

export async function getSiteFeelings(b64Url) {
  const siteFeelings = collection(db, "siteFeelings")
  const siteFeelingsQuery = query(siteFeelings, where("url", "==", b64Url))
  try {
    const querySnapshot = await getDocs(siteFeelingsQuery)
    return querySnapshot.docs.map((doc) => doc.data())
  } catch (error) {
    console.log(error)
  }
}

export async function getComments(b64Url, sort) {
  const commentsRef = collection(db, "comments")
  const commentsQuery = query(
    commentsRef,
    where("url", "==", b64Url),
    where("hidden", "==", false),
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

export async function createComment(comment, user, b64Url) {
  try {
    await addDoc(collection(db, "comments"), {
      text: comment,
      user: doc(db, `users/${user.uid}`),
      url: b64Url,
      createdAt: serverTimestamp(),
      hidden: false
    })
  } catch (e) {
    console.error("Error adding document: ", e)
  }
}

export async function deleteComment(commentId) {
  try {
    await updateDoc(doc(db, "comments", commentId), {
      hidden: true
    })
  } catch (e) {
    console.error("Error deleting document: ", e)
  }
}

export async function updateComment(commentId, comment) {
  try {
    await updateDoc(doc(db, "comments", commentId), {
      text: comment,
      updatedAt: serverTimestamp()
    })
  } catch (e) {
    console.error("Error updating document: ", e)
    throw e
  }
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
    reportedBy: userRef
  })
}
