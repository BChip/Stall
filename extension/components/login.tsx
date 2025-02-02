import { Button, LoadingOverlay } from "@mantine/core"
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithCredential
} from "firebase/auth"
import { doc, serverTimestamp, setDoc } from "firebase/firestore"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { auth, db } from "../config"

export interface ILoginPageProps {}

const Login: React.FunctionComponent<ILoginPageProps> = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<User>()
  const navigate = useNavigate()

  const onLoginClicked = () => {
    chrome.identity.getAuthToken({ interactive: true }, async function (token) {
      if (chrome.runtime.lastError || !token) {
        setIsLoading(false)
        return
      }
      if (token) {
        const credential = GoogleAuthProvider.credential(null, token)
        try {
          await signInWithCredential(auth, credential)
        } catch (e) {}
      }
    })
  }

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      setIsLoading(false)
      if (user) {
        setUser(user)
        void setDoc(doc(db, "users", user.uid), {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          createdAt: new Date(),
          uid: user.uid,
          user: user.uid,
          timeout: serverTimestamp()
        })
        navigate("/")
      }
    })
  }, [setUser, setIsLoading])

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 16
      }}>
      <LoadingOverlay overlayOpacity={1} visible={isLoading} />
      <Button
        onClick={() => {
          setIsLoading(true)
          onLoginClicked()
        }}>
        Log in / Authorize
      </Button>
    </div>
  )
}

export default Login
