import { Button, LoadingOverlay } from "@mantine/core"
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithCredential
} from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { auth } from "./config"
import { db } from "./config"

export interface ILoginPageProps {}

const Login: React.FunctionComponent<ILoginPageProps> = (props) => {
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<User>(null)
  const navigate = useNavigate()

  const onLogoutClicked = async () => {
    if (user) {
      await auth.signOut()
    }
  }

  const onLoginClicked = () => {
    chrome.identity.getAuthToken({ interactive: true }, async function (token) {
      if (chrome.runtime.lastError || !token) {
        console.error(chrome.runtime.lastError)
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
        setDoc(doc(db, "users", user.uid), {
          name: user.displayName,
          email: user.email,
          photoUrl: user.photoURL,
          createdAt: new Date(),
          user: user.uid
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
