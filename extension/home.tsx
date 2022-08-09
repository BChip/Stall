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
  ScrollArea,
  Text,
  Textarea
} from "@mantine/core"
import { NotificationsProvider } from "@mantine/notifications"
import { onAuthStateChanged } from "firebase/auth"
import { useEffect, useRef, useState } from "react"
import {
  AlertCircle,
  DoorExit,
  MoonStars,
  Sun,
  ThumbDown,
  ThumbUp
} from "tabler-icons-react"

import type { Comment } from "../shared/types/Comment"
import type { User } from "../shared/types/User"
import type { Site } from "../shared/types/Site"
import type { SiteFeeling } from "../shared/types/SiteFeeling"
import abbreviate from "./utilities/abbreviate"
import Comment from "./components/comment"
import { auth } from "./config"
import { filterComment } from "./utilities/filter"
import {
  createComment,
  createSiteFeeling,
  getComments,
  getSite,
  getUserLiked
} from "./db/firebase"
import ReportIssueModal from "./components/reportissuemodal"
import { errorToast, successToast, tooManyRequests } from "./utilities/toasts"

interface UserSettings {
  colorScheme: string
}

interface Coordinates {
  x: number
  y: number
}

const userSettings = getBucket<UserSettings>("userSettings")

function Home() {
  const [isFetching, setisFetching] = useState(true)
  const [isPushing, setIsPushing] = useState(false)
  const [user, setUser] = useState({} as User)
  const [colorScheme, setColorScheme] = useState<ColorScheme>({} as ColorScheme)
  const [comment, setComment] = useState("")
  const [comments, setComments] = useState<Comment[]>([])
  const [likes, setLikes] = useState(0)
  const [userLiked, setUserLiked] = useState<boolean | null>(null)
  const [siteB64Url, setSiteB64Url] = useState("")
  const [siteUrl, setSiteUrl] = useState("")
  const [commentError, setCommentError] = useState("")
  const [dislikes, setDislikes] = useState(0)
  const dark = colorScheme === "dark"
  const [commentSort, setCommentSort] = useState("createdAt")
  const [opened, setOpened] = useState(false)
  const [lastFetchComments, setLastFetchComments] = useState(0)
  const [doneScrolling, setDoneScrolling] = useState(false)
  const viewport = useRef<HTMLDivElement>()

  const toggleColorScheme = (value?: ColorScheme) => {
    const color = colorScheme === "light" ? "dark" : "light"
    userSettings
      .set({ colorScheme: value ?? color })
      .catch((err) => errorToast("Can't save color scheme. Try again later."))
    setColorScheme(value ?? color)
  }

  const fetchSiteFeelings = async (
    user: User,
    b64Url: string,
    force = false
  ) => {
    let site: Site | null = null
    let siteFeeling: SiteFeeling | null = null
    try {
      site = await getSite(b64Url)
      siteFeeling = await getUserLiked(user, b64Url, force)
    } catch (err) {
      let errorMessage = "Error. Try again later."
      if (err instanceof Error) {
        errorMessage = err.message
      }
      errorToast("Fetching site likes and dislikes - " + errorMessage)
    }
    if (site) {
      setLikes(site.likes)
      setDislikes(site.dislikes)
    }
    if (siteFeeling) {
      setUserLiked(siteFeeling.like)
    } else {
      setUserLiked(null)
    }
  }

  const onScrollPositionChange = async (cordinates: Coordinates) => {
    // 20% of the viewport.current.scrollHeight
    if (viewport.current) {
      const scrollHeightThreshold =
        viewport.current.scrollHeight - viewport.current.scrollHeight * 0.4
      if (
        cordinates.y > scrollHeightThreshold &&
        !isFetching &&
        !doneScrolling
      ) {
        await fetchComments(siteB64Url, commentSort)
      }
    }
  }

  const fetchComments = async (site: string, sort: string, force = false) => {
    let lastComment
    if (comments.length > 0) {
      lastComment = comments[comments.length - 1]
    }
    let newComments
    try {
      if (lastComment && !force) {
        newComments = await getComments(site, sort, lastComment)
      } else {
        newComments = await getComments(site, sort)
      }
    } catch (err) {
      let errorMessage = "Error. Try again later."
      if (err instanceof Error) {
        errorMessage = err.message
      }
      if (errorMessage.includes("index")) {
        errorToast(
          "Cannot fetch and sort at this time. Please try again later."
        )
      } else {
        errorToast("Fetching comments - " + errorMessage)
      }
    }
    if (newComments) {
      let concatenatedComments: Comment[] = []
      if (force) {
        concatenatedComments = [...newComments]
      } else {
        concatenatedComments = [...comments, ...newComments]
      }

      setLastFetchComments(concatenatedComments.length)
      if (lastFetchComments === concatenatedComments.length && !force) {
        setDoneScrolling(true)
      } else {
        setDoneScrolling(false)
      }
      setComments(concatenatedComments)
    }
  }

  const getCurrentTab = async () => {
    const queryOptions = { active: true, currentWindow: true }
    const tabs = await chrome.tabs.query(queryOptions)
    return tabs[0]?.url
  }

  const getColorScheme = async () => {
    const settings = await userSettings.get()
    setColorScheme(settings.colorScheme as ColorScheme)
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
          setSiteUrl(tabUrl)
          setSiteB64Url(b64Url)
          fetchSiteFeelings(user, b64Url).catch((err) => {
            errorToast(err.message)
          })
          fetchComments(b64Url, commentSort).catch((err) => {
            errorToast(err.message)
          })
          setisFetching(false)
        })
      } else {
      }
    })

    return () => AuthCheck()
  }, [auth])

  const submitComment = async () => {
    setIsPushing(true)
    let filteredComment
    try {
      filteredComment = filterComment(comment)
    } catch (error) {
      let errorMessage = "Error. Try again later."
      if (error instanceof Error) {
        errorMessage = error.message
      }
      errorToast(errorMessage)
      setCommentError(errorMessage)
    }
    if (filteredComment) {
      let exception = false
      try {
        await createComment(filteredComment, user, siteB64Url)
      } catch (err) {
        let errorMessage = "Error. Try again later."
        if (err instanceof Error) {
          errorMessage = err.message
        }
        if (errorMessage.includes("permissions")) {
          const customError =
            "You are sending too many requests... Please try again in a couple minutes..."
          errorToast(customError)
          setCommentError(customError)
        } else {
          const customError = "Cannot create comment - " + errorMessage
          errorToast(customError)
          setCommentError(customError)
        }
        exception = true
      } finally {
        if (!exception) {
          setComment("")
          setCommentError("")
          fetchComments(siteB64Url, commentSort, true).catch((err) => {
            let errorMessage = "Error. Try again later."
            if (err instanceof Error) {
              errorMessage = err.message
            }
            errorToast(errorMessage)
          })
        }
      }
      setIsPushing(false)
    }
  }

  const removeCommentFromView = (commentId: string) => {
    const newComments = comments.filter((comment) => comment.id !== commentId)
    setComments(newComments)
  }

  const vote = async (feeling: boolean) => {
    setIsPushing(true)
    let exception = false
    try {
      await createSiteFeeling(feeling, user, siteB64Url, siteUrl)
    } catch (err) {
      let errorMessage = "Error. Try again later."
      if (err instanceof Error) {
        errorMessage = err.message
      }
      if (errorMessage.includes("permissions")) {
        tooManyRequests()
      } else {
        errorToast("Cannot update like/dislike - " + errorMessage)
      }
      exception = true
    } finally {
      if (!exception) {
        fetchSiteFeelings(user, siteB64Url, true).catch((err) => {
          let errorMessage = "Error. Try again later."
          if (err instanceof Error) {
            errorMessage = err.message
          }
          errorToast(errorMessage)
        })
        successToast("We are processing the request...")
      }
    }
    setIsPushing(false)
  }

  // const setSort = (value) => {
  //   setCommentSort(value)
  //   fetchComments(siteB64Url, value)
  // }

  return (
    <div style={{ minWidth: "500px" }}>
      <>
        <ReportIssueModal opened={opened} setOpened={setOpened} />
      </>
      {colorScheme === null ? (
        <></>
      ) : (
        <>
          <LoadingOverlay visible={isFetching} overlayOpacity={0} />
          <ColorSchemeProvider
            colorScheme={colorScheme}
            toggleColorScheme={toggleColorScheme}>
            <MantineProvider
              theme={{ colorScheme }}
              withNormalizeCSS
              withGlobalStyles>
              <NotificationsProvider autoClose={4000} limit={1}>
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
                        onClick={() => void auth.signOut()}>
                        Sign out
                      </Menu.Item>
                    </Menu>
                  </div>
                  <Group spacing="xs" mt="xs">
                    {userLiked !== null ? (
                      <>
                        <ActionIcon
                          disabled={userLiked || isPushing}
                          onClick={() => void vote(true)}>
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
                          disabled={!userLiked || isPushing}
                          onClick={() => void vote(false)}>
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
                        <ActionIcon
                          onClick={() => void vote(true)}
                          disabled={isPushing}>
                          <ThumbUp strokeWidth={2} size={18} color={"green"} />
                        </ActionIcon>
                        <Text>{likes}</Text>
                        <ActionIcon
                          onClick={() => void vote(false)}
                          disabled={isPushing}>
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
                        error={commentError}
                        required
                      />
                    </Grid.Col>
                    <Grid.Col span={3}>
                      <Button
                        disabled={comment.length === 0 || isPushing}
                        onClick={() => void submitComment()}>
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
                      {/*<Grid.Col offset={4} span={5}>
                        <Select
                          value={commentSort}
                          onChange={(value) => setSort(value)}
                          data={[
                            { value: "createdAt", label: "Created At" },
                            { value: "text", label: "Alphabetical" }
                          ]}
                        />
                        </Grid.Col>*/}
                    </Grid>

                    <ScrollArea
                      style={{ height: 250 }}
                      mb="xs"
                      viewportRef={viewport}
                      // eslint-disable-next-line @typescript-eslint/no-misused-promises
                      onScrollPositionChange={onScrollPositionChange}>
                      {comments.map((comment) => {
                        return (
                          <Comment
                            key={comment.id}
                            id={comment.id}
                            b64Url={siteB64Url}
                            userDoc={comment.user}
                            comment={comment.text}
                            createdAt={comment.createdAt.toDate().toISOString()}
                            loggedInUser={user}
                            removeCommentFromView={removeCommentFromView}
                            updatedAt={comment.updatedAt
                              ?.toDate()
                              .toISOString()}
                          />
                        )
                      })}
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
