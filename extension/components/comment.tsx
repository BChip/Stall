import {
  Avatar,
  Button,
  Grid,
  Group,
  Menu,
  Paper,
  Text,
  Textarea
} from "@mantine/core"
import type { DocumentReference } from "firebase/firestore"
import moment from "moment"
import { useEffect, useState } from "react"
import { Flag, Pencil, Trash } from "tabler-icons-react"

import type { User } from "../../shared/types/User"
import { auth } from "../config"
import { deleteComment, getUser, updateComment } from "../db/firebase"
import { filterComment } from "../utilities/filter"
import { errorToast, successToast, tooManyRequests } from "../utilities/toasts"
import ReportCommentModal from "./reportcommentmodal"

interface Props {
  id: string
  userDoc: DocumentReference
  comment: string
  createdAt: string
  b64Url: string
  removeCommentFromView: unknown
  updatedAt: string
  loggedInUser: User
}

function Comment({
  id,
  userDoc,
  comment,
  createdAt,
  b64Url,
  removeCommentFromView,
  updatedAt,
  loggedInUser
}: Props) {
  const [userData, setUserData] = useState<User>({} as User)

  const [opened, setOpened] = useState(false)

  const [commentEdit, setCommentEdit] = useState(false)

  const [updatedCommentText, setUpdatedCommentText] = useState(comment)

  const [updatedTime, setUpdatedTime] = useState(updatedAt)

  const [updatedCommentError, setUpdatedCommentError] = useState("")

  const submitUpdatedComment = async () => {
    let filteredUpdatedCommentText
    try {
      filteredUpdatedCommentText = filterComment(updatedCommentText)
    } catch (error) {
      let errorMessage = "Error. Please try again later."
      if (error instanceof Error) {
        errorMessage = error.message
      }
      errorToast(errorMessage)
      setUpdatedCommentError(errorMessage)
    }
    if (filteredUpdatedCommentText) {
      try {
        await updateComment(id, filteredUpdatedCommentText)
        setCommentEdit(false)
        setUpdatedCommentError("")
        const time = moment().toISOString()
        setUpdatedTime(time)
      } catch (err) {
        let errorMessage = "Error. Please try again later."
        if (err instanceof Error) {
          errorMessage = err.message
        }
        if (errorMessage.includes("permissions")) {
          tooManyRequests()
        } else {
          errorToast("Cannot update comment - " + errorMessage)
        }
      }
    }
  }

  const delComment = async () => {
    try {
      await deleteComment(id)
      removeCommentFromView(id)
      successToast("Comment Deleted!")
    } catch (err) {
      let errorMessage = "Error. Please try again later."
      if (err instanceof Error) {
        errorMessage = err.message
      }
      if (errorMessage.includes("permissions")) {
        tooManyRequests()
      } else {
        errorToast("Cannot delete comment - " + errorMessage)
      }
    }
  }

  useEffect(() => {
    getUser(userDoc, b64Url)
      .then((userData) => {
        setUserData(userData)
      })
      .catch((err) => {
        let errorMessage = "Error. Please try again later."
        if (err instanceof Error) {
          errorMessage = err.message
        }
        errorToast("Cannot get user data - " + errorMessage)
      })
  }, [])

  return (
    <>
      <ReportCommentModal
        opened={opened}
        setOpened={setOpened}
        user={loggedInUser}
        comment={id}
      />
      <Paper mt="sm" shadow="sm" p="sm" withBorder={true}>
        <Grid columns={48}>
          <Grid.Col span={5}>
            {userData.photoURL ? (
              <Avatar
                size="md"
                src={userData.photoURL}
                radius="xl"
                mt="xs"></Avatar>
            ) : (
              <Avatar size="md" radius="xl" mt="xs"></Avatar>
            )}
          </Grid.Col>
          <Grid.Col span={43}>
            <Grid>
              <Grid.Col span={10}>
                <Text size="xs" mt="xs" color="dimmed">
                  {userData.displayName} -{" "}
                  {updatedTime
                    ? moment(updatedTime).fromNow() + " (edited)"
                    : moment(createdAt).fromNow()}
                </Text>
              </Grid.Col>
              <Grid.Col span={2}>
                <Menu ml="md" size="xs">
                  {userDoc.id === auth.currentUser?.uid ? (
                    <>
                      <Menu.Item
                        icon={<Pencil size={12} color={"black"} />}
                        onClick={() => setCommentEdit(true)}>
                        Edit
                      </Menu.Item>
                      <Menu.Item
                        icon={<Trash size={12} color={"red"} />}
                        onClick={() => void delComment()}>
                        Delete
                      </Menu.Item>
                    </>
                  ) : (
                    <Menu.Item
                      icon={<Flag size={12} color={"orange"} />}
                      onClick={() => setOpened(true)}>
                      Report
                    </Menu.Item>
                  )}
                </Menu>
              </Grid.Col>
            </Grid>
            {commentEdit ? (
              <>
                <Textarea
                  autosize
                  value={updatedCommentText}
                  maxLength={140}
                  onChange={(e) => setUpdatedCommentText(e.target.value)}
                  error={updatedCommentError}
                  required
                  style={{ width: "350px" }}
                />
                <Text size="xs" color="dimmed">
                  {updatedCommentText.length} / 140
                </Text>
                <Group>
                  <Button
                    size="xs"
                    disabled={
                      updatedCommentText === comment ||
                      updatedCommentText.length === 0
                    }
                    onClick={() => void submitUpdatedComment()}>
                    Submit
                  </Button>
                  <Button
                    size="xs"
                    color="gray"
                    onClick={() => setCommentEdit(false)}>
                    Cancel
                  </Button>
                </Group>
              </>
            ) : (
              <Text style={{ width: 350, wordWrap: "break-word" }} size="sm">
                {updatedCommentText}
              </Text>
            )}
          </Grid.Col>
        </Grid>
        {/*<Group spacing="xs" mt="xs">
            <Button variant="outline" size="xs" leftIcon={<Message size={18}/>}>Reply</Button>*/}
        {/* <ActionIcon><ThumbUp size={18} color={"green"} /></ActionIcon>
                <Text>{likes}</Text>
                <ActionIcon><ThumbDown size={18} color={"red"} /></ActionIcon>
                <Text>{dislikes}</Text> 
                
            </Group>*/}
        {/*
            <Accordion>
                {replies.length !== 0 ? 
                <Accordion.Item label={`View ${replies.length} replies`}>
                    <Text>This is a long comment that someone posted and wants everyone to see. People like to write paragraphs. It is just how they are! Why do people even care? I have no clue!</Text>
                </Accordion.Item>
                     : <></> }
                  
            </Accordion> */}
      </Paper>
    </>
  )
}

export default Comment
