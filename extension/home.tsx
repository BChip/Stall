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
  Modal,
  Notification,
  ScrollArea,
  Select,
  Text,
  Textarea
} from "@mantine/core"
import { NotificationsProvider, showNotification } from "@mantine/notifications"
import Filter from "bad-words"
import { onAuthStateChanged } from "firebase/auth"
import { useEffect, useState } from "react"
import {
  AlertCircle,
  Check,
  DoorExit,
  MoonStars,
  Sun,
  ThumbDown,
  ThumbUp
} from "tabler-icons-react"

import abbreviate from "~abbreviate"
import Comment from "~comment"
import ReportModal from "~reportmodal"

import { auth } from "./config"
import {
  createComment,
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
  const [comment, setComment] = useState("")
  const [comments, setComments] = useState([])
  const [likes, setLikes] = useState(0)
  const [userLiked, setUserLiked] = useState(null)
  const [siteB64Url, setSiteB64Url] = useState("")
  const [dislikes, setDislikes] = useState(0)
  const dark = colorScheme === "dark"
  const [commentSort, setCommentSort] = useState("createdAt")
  const [opened, setOpened] = useState(false)
  const [titleIssue, setTitleIssue] = useState("")
  const [bodyIssue, setBodyIssue] = useState("")

  const toggleColorScheme = (value?: ColorScheme) => {
    const color = colorScheme === "light" ? "dark" : "light"
    userSettings.set({ colorScheme: value || color })
    setColorScheme(value || color)
  }

  const fetchSiteFeelings = async (user, site) => {
    const siteFeelings = await getSiteFeelings(site)
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

  const fetchComments = async (site, sort) => {
    setComments(await getComments(site, sort))
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
          setSiteB64Url(b64Url)
          fetchSiteFeelings(user, b64Url).catch((err) => {
            setError(err)
          })
          fetchComments(b64Url, commentSort).catch((err) => {
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
    await createComment(filteredComment, user, siteB64Url)
    setComment("")
    fetchComments(siteB64Url, commentSort).catch((err) => {
      setError(err)
    })
  }

  const removeCommentFromView = (commentId) => {
    //remove commment from comments array
    const newComments = comments.filter((comment) => comment.id !== commentId)
    setComments(newComments)
  }

  const vote = async (feeling) => {
    await createSiteFeeling(feeling, user, siteB64Url)
    fetchSiteFeelings(user, siteB64Url).catch((err) => {
      setError(err)
    })
  }

  const openReportNotification = () => {
    showNotification({
      title: "Thank you!",
      color: "teal",
      icon: <Check />,
      message: "We will review it and take appropriate action."
    })
  }

  const setSort = (value) => {
    setCommentSort(value)
    fetchComments(siteB64Url, value)
  }

  return (
    <div style={{ minWidth: "500px" }}>
      <>
        <ReportModal
          opened={opened}
          setOpened={setOpened}
          openReportNotification={openReportNotification}
        />
      </>
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
              <NotificationsProvider autoClose={4000}>
                <Container>
                  <div style={{ position: "absolute", right: 10 }}>
                    <Menu delay={500}>
                      <Menu.Item
                        onClick={() => toggleColorScheme()}
                        icon={
                          dark ? <Sun size={14} /> : <MoonStars size={14} />
                        }>
                        {dark ? "Turn On Light Mode" : "Turn On Dark Mode"}
                      </Menu.Item>
                      <Menu.Item
                        icon={<AlertCircle size={14} />}
                        onClick={() => setOpened(true)}>
                        Report an issue
                      </Menu.Item>
                      <Menu.Item
                        icon={<DoorExit size={14} />}
                        onClick={() => auth.signOut()}>
                        Sign out
                      </Menu.Item>
                    </Menu>
                  </div>
                  <Group spacing="xs" mt="xs">
                    {userLiked !== null ? (
                      <>
                        <ActionIcon
                          disabled={userLiked}
                          onClick={() => vote(true)}>
                          {userLiked ? (
                            <ThumbUp
                              size={18}
                              fill={"green"}
                              fillOpacity={0.3}
                              color={"green"}
                            />
                          ) : (
                            <ThumbUp
                              strokeOpacity={0.3}
                              size={18}
                              color={"green"}
                            />
                          )}
                        </ActionIcon>
                        {userLiked ? (
                          <Text color={"green"}>{abbreviate(likes, 0)}</Text>
                        ) : (
                          <Text>{abbreviate(likes, 0)}</Text>
                        )}
                        <ActionIcon
                          disabled={!userLiked}
                          onClick={() => vote(false)}>
                          {userLiked ? (
                            <>
                              <ThumbDown
                                strokeOpacity={0.3}
                                size={18}
                                color={"red"}
                              />
                            </>
                          ) : (
                            <ThumbDown
                              size={18}
                              fill={"red"}
                              fillOpacity={0.3}
                              color={"red"}
                            />
                          )}
                        </ActionIcon>
                        {userLiked ? (
                          <Text>{abbreviate(dislikes, 0)}</Text>
                        ) : (
                          <Text color={"red"}>{abbreviate(dislikes, 0)}</Text>
                        )}
                      </>
                    ) : (
                      <>
                        <ActionIcon onClick={() => vote(true)}>
                          <ThumbUp strokeWidth={2} size={18} color={"green"} />
                        </ActionIcon>
                        <Text>{likes}</Text>
                        <ActionIcon onClick={() => vote(false)}>
                          <ThumbDown strokeWidth={2} size={18} color={"red"} />
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
                      <Button
                        disabled={comment.length === 0}
                        onClick={() => submitComment()}>
                        Submit
                      </Button>
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
                          user={comment.user}
                          comment={comment.text}
                          createdAt={comment.createdAt.toDate().toISOString()}
                          openReportNotification={openReportNotification}
                          removeCommentFromView={removeCommentFromView}
                          updatedAt={comment.updatedAt?.toDate().toISOString()}
                        />
                      ))}
                    </ScrollArea>
                  </>
                </Container>
              </NotificationsProvider>
            </MantineProvider>
          </ColorSchemeProvider>
        </>
      )}
    </div>
  )
}

export default Home
