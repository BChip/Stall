import {
  Accordion,
  ActionIcon,
  Avatar,
  Button,
  ColorScheme,
  ColorSchemeProvider,
  Container,
  Divider,
  Grid,
  Group,
  Loader,
  LoadingOverlay,
  MantineProvider,
  Modal,
  Notification,
  Paper,
  ScrollArea,
  Select,
  Text,
  Textarea
} from "@mantine/core"
import { useLocalStorageValue } from "@mantine/hooks"
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signOut
} from "firebase/auth"
import {
  DocumentReference,
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
import { useEffect, useState } from "react"
import {
  Check,
  Flag,
  Message,
  MoonStars,
  Sun,
  ThumbDown,
  ThumbUp
} from "tabler-icons-react"

import abbreviate from "~abbreviate"
import Comment from "~comment"

import { auth, db } from "./config"

function Home() {
  //generate random number between 1000 and 10000000
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState(null)
  const randomNum: string = abbreviate(
    Math.floor(Math.random() * (10000000 - 1000 + 1)) + 1000,
    0
  )
  const [colorScheme, setColorScheme] = useState<ColorScheme>("light")
  const [error, setError] = useState("")
  const [siteRef, setSiteRef] = useState({})
  const [comment, setComment] = useState("")
  const [comments, setComments] = useState([])
  const [likes, setLikes] = useState(0)
  const [userLiked, setUserLiked] = useState(null)
  const [dislikes, setDislikes] = useState(0)
  const dark = colorScheme === "dark"
  const [commentSort, setCommentSort] = useState("createdAt")
  const [reportNotification, setReportNotification] = useState(true)
  const toggleColorScheme = (value?: ColorScheme) => {
    setColorScheme(value || (colorScheme === "light" ? "dark" : "light"))
  }

  const fetchSiteFeelings = async (user, siteRef) => {
    const siteFeelings = collection(db, "siteFeelings")
    const siteFeelingsQuery = query(siteFeelings, where("url", "==", siteRef))
    try {
      const querySnapshot = await getDocs(siteFeelingsQuery)
      const siteFeelings = querySnapshot.docs.map((doc) => doc.data())
      const likes = siteFeelings.filter(
        (siteFeeling) => siteFeeling.like
      ).length
      const dislikes = siteFeelings.filter(
        (siteFeeling) => !siteFeeling.like
      ).length
      const userLiked = siteFeelings.find(
        (siteFeeling) => siteFeeling.user.id === user.uid
      )
      setLikes(likes)
      setDislikes(dislikes)
      if (userLiked) {
        setUserLiked(userLiked.like)
      } else {
        setUserLiked(null)
      }
    } catch (error) {
      console.log(error)
    }
  }

  const fetchComments = async (siteRef, sort) => {
    const commentsRef = collection(db, "comments")
    const commentsQuery = query(
      commentsRef,
      where("url", "==", siteRef),
      orderBy(sort, "desc")
    )
    try {
      const querySnapshot = await getDocs(commentsQuery)
      const comments = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id
      }))
      setComments(comments)
    } catch (error) {
      console.log(error)
    }
  }

  const createSite = async (tabUrl, b64Url) => {
    setDoc(doc(db, "sites", b64Url), {
      url: tabUrl
    })
  }

  const getCurrentTab = async () => {
    let queryOptions = { active: true, currentWindow: true }
    let tabs = await chrome.tabs.query(queryOptions)
    return tabs[0].url
  }

  useEffect(() => {
    setIsLoading(true)
    const AuthCheck = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user)
        getCurrentTab().then((tabUrl) => {
          const b64Url = Buffer.from(tabUrl)
            .toString("base64")
            .replace("/", "_")
          createSite(tabUrl, b64Url)
          const siteRef = doc(db, `sites/${b64Url}`)
          setSiteRef(siteRef)
          fetchSiteFeelings(user, siteRef).catch((err) => {
            setError(err)
          })
          fetchComments(siteRef, commentSort).catch((err) => {
            setError(err)
          })
          setIsLoading(false)
        })
      } else {
      }
    })

    return () => AuthCheck()
  }, [auth])

  const createComment = async () => {
    try {
      const docRef = await addDoc(collection(db, "comments"), {
        text: comment,
        author: doc(db, `users/${user.uid}`),
        url: siteRef,
        createdAt: serverTimestamp()
      })
      setComment("")
      fetchComments(siteRef, commentSort).catch((err) => {
        setError(err)
      })
    } catch (e) {
      console.error("Error adding document: ", e)
    }
  }

  const vote = async (feeling) => {
    const userRef = doc(db, `users/${user.uid}`)
    await setDoc(doc(db, "siteFeelings", userRef.id + siteRef.id), {
      url: siteRef,
      user: userRef,
      like: feeling
    })
    fetchSiteFeelings(user, siteRef).catch((err) => {
      setError(err)
    })
  }

  const setSort = (value) => {
    setCommentSort(value)
    fetchComments(siteRef, value)
  }

  return (
    <div style={{ minWidth: "500px" }}>
      <ColorSchemeProvider
        colorScheme={colorScheme}
        toggleColorScheme={toggleColorScheme}>
        <MantineProvider
          theme={{ colorScheme }}
          withNormalizeCSS
          withGlobalStyles>
          {/* <Button onClick={() => signOut(auth)}>Sign out</Button> */}
          <Container>
            <LoadingOverlay visible={isLoading} />
            <ActionIcon
              variant="outline"
              color={dark ? "yellow" : "blue"}
              onClick={() => toggleColorScheme()}
              title="Toggle color schema">
              {dark ? <Sun size={18} /> : <MoonStars size={18} />}
            </ActionIcon>
            <Group spacing="xs" mt="xs">
              {userLiked !== null ? (
                <>
                  <ActionIcon onClick={() => vote(true)}>
                    {userLiked ? (
                      <ThumbUp
                        size={18}
                        fill={"green"}
                        fillOpacity={0.3}
                        color={"green"}
                      />
                    ) : (
                      <ThumbUp size={18} color={"green"} />
                    )}
                  </ActionIcon>
                  <Text>{likes}</Text>
                  <ActionIcon onClick={() => vote(false)}>
                    {userLiked ? (
                      <ThumbDown size={18} color={"red"} />
                    ) : (
                      <ThumbDown
                        size={18}
                        fill={"red"}
                        fillOpacity={0.3}
                        color={"red"}
                      />
                    )}
                  </ActionIcon>
                  <Text>{dislikes}</Text>
                </>
              ) : (
                <>
                  <ActionIcon onClick={() => vote(true)}>
                    <ThumbUp size={18} color={"green"} />
                  </ActionIcon>
                  <Text>{likes}</Text>
                  <ActionIcon onClick={() => vote(false)}>
                    <ThumbDown size={18} color={"red"} />
                  </ActionIcon>
                  <Text>{dislikes}</Text>
                </>
              )}
            </Group>

            <Divider mt="sm" />
            <Group mt="sm">
              <Textarea
                autosize
                value={comment}
                maxLength={140}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Your comment"
                error={error}
                required
                style={{ width: "350px" }}
              />
              <Button onClick={() => createComment()}>Submit</Button>
            </Group>
            <Text size="xs" color="dimmed">
              {comment.length} / 140
            </Text>
            <Divider mt="sm" mb="sm" />
            <>
              <Grid>
                <Grid.Col span={3}>
                  <Text mt="xs">Comments:</Text>
                </Grid.Col>
                <Grid.Col offset={4} span={5}>
                  <Select
                    value={commentSort}
                    onChange={(value) => setSort(value)}
                    data={[
                      { value: "createdAt", label: "Created At" },
                      { value: "text", label: "Alphabetical" }
                    ]}
                  />
                </Grid.Col>
              </Grid>

              <ScrollArea style={{ height: 250 }}>
                {comments.map((comment, i) => (
                  <Comment
                    key={i}
                    id={comment.id}
                    user={comment.author}
                    comment={comment.text}
                    createdAt={comment.createdAt.toDate().toISOString()}
                    setReportNotification={setReportNotification}
                  />
                ))}
              </ScrollArea>
            </>
          </Container>
        </MantineProvider>
      </ColorSchemeProvider>
      <Notification
        hidden={reportNotification}
        icon={<Check size={18} />}
        color="teal"
        title="Thank you for reporting this comment.">
        We will review it and take appropriate action.
      </Notification>
    </div>
  )
}

export default Home
