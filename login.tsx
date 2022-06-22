import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithCredential
} from "firebase/auth"
import { useEffect, useState } from "react"
import { auth } from "./config"
import { useNavigate } from 'react-router-dom';
import { collection, setDoc, doc } from "firebase/firestore"; 
import { db } from "./config";

export interface ILoginPageProps {}

const Login: React.FunctionComponent<ILoginPageProps> = (props) => {
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<User>(null)
  const navigate = useNavigate();

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
        } catch (e) {
          
        }
      }
    })
  }

  useEffect(() => {
    
    onAuthStateChanged(auth, (user) => {
      setIsLoading(false)
      if(user) {
        setUser(user)
        setDoc(doc(db, "users", user.uid),{
          name: user.displayName,
          email: user.email,
          photoUrl: user.photoURL,
          createdAt: new Date()
        })
        navigate('/')
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
      <h1>
        Welcome to your <a href="https://www.plasmo.com">Plasmo</a> Extension!
      </h1>
      {!user ? (
        <button
          onClick={() => {
            setIsLoading(true)
            onLoginClicked()
          }}>
          Log in
        </button>
      ) : (
        <button
          onClick={() => {
            setIsLoading(true)
            onLogoutClicked()
          }}>
          Log out
        </button>
      )}
      <div>
        {isLoading ? "Loading..." : ""}
        {!!user ? (
          <div>
            Welcome to Plasmo, {user.displayName} your email address is{" "}
            {user.email}
          </div>
        ) : (
          ""
        )}
      </div>
    </div>
    );
};

export default Login;