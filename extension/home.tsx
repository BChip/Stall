import { storage } from "@extend-chrome/storage"
import { getBucket } from "@extend-chrome/storage"
import {
  ActionIcon,
  Button,
  ColorScheme,
  ColorSchemeProvider,
  Container,
  Divider,
  Grid,
  Group,
  LoadingOverlay,
  MantineProvider,
  Menu,
  Notification,
  ScrollArea,
  Select,
  Text,
  Textarea
} from "@mantine/core"
import Filter from "bad-words"
import { onAuthStateChanged } from "firebase/auth"
import { doc } from "firebase/firestore"
import { useEffect, useState } from "react"
import {
  Check,
  DoorExit,
  MoonStars,
  Sun,
  ThumbDown,
  ThumbUp
} from "tabler-icons-react"

import abbreviate from "~abbreviate"
import Comment from "~comment"

import { auth, db } from "./config"
import {
  createComment,
  createSite,
  createSiteFeeling,
  getComments,
  getSiteFeelings
} from "./firebase"

interface UserSettings {
  colorScheme: string
}

let filter = new Filter()

const userSettings = getBucket<UserSettings>("userSettings")

function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [colorScheme, setColorScheme] = useState<ColorScheme>(null)
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
    const color = colorScheme === "light" ? "dark" : "light"
    userSettings.set({ colorScheme: value || color })
    setColorScheme(value || color)
  }

  const fetchSiteFeelings = async (user, siteRef) => {
    const siteFeelings = await getSiteFeelings(siteRef)
    const likes = siteFeelings.filter((siteFeeling) => siteFeeling.like).length
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
  }

  const fetchComments = async (siteRef, sort) => {
    setComments(await getComments(siteRef, sort))
  }

  const getCurrentTab = async () => {
    let queryOptions = { active: true, currentWindow: true }
    let tabs = await chrome.tabs.query(queryOptions)
    return tabs[0].url
  }

  const getColorScheme = async () => {
    const settings = await userSettings.get()
    setColorScheme(settings.colorScheme)
  }

  useEffect(() => {
    getColorScheme()
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

  const submitComment = async () => {
    // set error if commment contains URL regex
    if (
      comment.match(
        /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/
      )
    ) {
      setError("Please don't use Domains or URLs in comments.")
      return
    }
    // filter swear words
    const filteredComment = filter.clean(comment)
    await createComment(filteredComment, user, siteRef)
    setComment("")
    fetchComments(siteRef, commentSort).catch((err) => {
      setError(err)
    })
  }

  const removeCommentFromView = (commentId) => {
    //remove commment from comments array
    const newComments = comments.filter((comment) => comment.id !== commentId)
    setComments(newComments)
  }

  const vote = async (feeling) => {
    await createSiteFeeling(feeling, user, siteRef)
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
      {colorScheme === null ? (
        <></>
      ) : (
        <>
          <LoadingOverlay visible={isLoading} overlayOpacity={0} />
          <ColorSchemeProvider
            colorScheme={colorScheme}
            toggleColorScheme={toggleColorScheme}>
            <MantineProvider
              theme={{ colorScheme }}
              withNormalizeCSS
              withGlobalStyles>
              {/* <Button onClick={() => signOut(auth)}>Sign out</Button> */}
              <Container>
                <div style={{ position: "absolute", right: 10 }}>
                  <Menu trigger="hover" delay={500}>
                    <Menu.Item
                      onClick={() => toggleColorScheme()}
                      icon={dark ? <Sun size={14} /> : <MoonStars size={14} />}>
                      {dark ? "Turn On Light Mode" : "Turn On Dark Mode"}
                    </Menu.Item>
                    <Menu.Item icon={<DoorExit size={14} />}>
                      Sign out (not implemented)
                    </Menu.Item>
                  </Menu>
                </div>
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
                      <Text>{abbreviate(likes, 0)}</Text>
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
                      <Text>{abbreviate(dislikes, 0)}</Text>
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
                <Grid mt="sm">
                  <Grid.Col span={9}>
                    <Textarea
                      autosize
                      value={comment}
                      maxLength={140}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Your comment"
                      error={error}
                      required
                    />
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Button onClick={() => submitComment()}>Submit</Button>
                  </Grid.Col>
                </Grid>
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
                    {comments.map((comment) => (
                      <Comment
                        key={comment.id}
                        id={comment.id}
                        user={comment.author}
                        comment={comment.text}
                        createdAt={comment.createdAt.toDate().toISOString()}
                        setReportNotification={setReportNotification}
                        removeCommentFromView={removeCommentFromView}
                        updatedAt={comment.updatedAt?.toDate().toISOString()}
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
        </>
      )}
    </div>
  )
}

export default Home
