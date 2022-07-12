import {
  Avatar,
  Button,
  Container,
  Grid,
  Menu,
  Modal,
  Paper,
  Select,
  Text,
  Textarea
} from "@mantine/core"
import { getDoc } from "firebase/firestore"
import moment from "moment"
import { useEffect, useState } from "react"
import { Flag, Pencil, Trash } from "tabler-icons-react"

import { auth } from "~config"

import { createCommentReport, deleteComment, updateComment } from "./firebase"

function Comment({
  id,
  user,
  comment,
  createdAt,
  openReportNotification,
  removeCommentFromView,
  updatedAt
}) {
  const [userData, setUserData] = useState({})

  const [opened, setOpened] = useState(false)

  const [reportReason, setReportReason] = useState("")

  const [commentEdit, setCommentEdit] = useState(false)

  const [updatedCommentText, setUpdatedCommentText] = useState(comment)

  const [updatedTime, setUpdatedTime] = useState(updatedAt)

  const report = () => {
    setOpened(false)
    createCommentReport(reportReason, user, id)
    openReportNotification()
  }

  const getUser = async () => {
    const docSnap = await getDoc(user)
    if (docSnap.exists()) {
      const userData = docSnap.data()
      return userData
    }
  }

  const submitUpdatedComment = async () => {
    updateComment(id, updatedCommentText)
    setCommentEdit(false)
    const time = moment().toISOString()
    console.log(time, updatedAt)
    setUpdatedTime(time)
  }

  const delComment = async () => {
    await deleteComment(id)
    removeCommentFromView(id)
  }

  useEffect(() => {
    getUser()
      .then((userData) => {
        setUserData(userData)
      })
      .catch((err) => {
        console.log(err)
      })
  }, [])

  return (
    <>
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Report Comment">
        <Container>
          <Select
            label="Reason"
            placeholder="Pick one"
            required
            allowDeselect
            value={reportReason}
            onChange={setReportReason}
            data={[
              {
                value: "commercial",
                label: "Unwanted commericial content or spam"
              },
              {
                value: "sexual",
                label: "Pornography or sexually explicit material"
              },
              { value: "abuse", label: "Child abuse" },
              { value: "hate", label: "Hate speech or graphic violence" },
              { value: "terrorism", label: "Promotes terrorism" },
              { value: "harrassment", label: "Harassment or bullying" },
              { value: "suicide", label: "Suicide or self injury" },
              { value: "misinformation", label: "Misinformation" }
            ]}
          />
          <Button onClick={() => report()} mt="sm" color={"red"}>
            Report
          </Button>
        </Container>
      </Modal>
      <Paper mt="sm" shadow="sm" p="sm" withBorder={true}>
        <Grid columns={48}>
          <Grid.Col span={5}>
            {userData.photoUrl ? (
              <Avatar
                size="md"
                src={userData.photoUrl}
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
                  {userData.name} -{" "}
                  {updatedTime
                    ? moment(updatedTime).fromNow() + " (edited)"
                    : moment(createdAt).fromNow()}
                </Text>
              </Grid.Col>
              <Grid.Col span={2}>
                <Menu ml="md" size="xs">
                  <Menu.Item
                    icon={<Flag size={12} color={"orange"} />}
                    onClick={() => setOpened(true)}>
                    Report
                  </Menu.Item>
                  {user.id === auth.currentUser.uid ? (
                    <>
                      <Menu.Item
                        icon={<Pencil size={12} color={"black"} />}
                        onClick={() => setCommentEdit(true)}>
                        Edit
                      </Menu.Item>
                      <Menu.Item
                        icon={<Trash size={12} color={"red"} />}
                        onClick={() => delComment()}>
                        Delete
                      </Menu.Item>
                    </>
                  ) : null}
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
                  required
                  style={{ width: "350px" }}
                />
                <Text size="xs" color="dimmed">
                  {updatedCommentText.length} / 140
                </Text>
                <Button
                  disabled={
                    updatedCommentText === comment ||
                    updatedCommentText.length === 0
                  }
                  onClick={() => submitUpdatedComment()}>
                  Submit
                </Button>
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
