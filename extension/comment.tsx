import { Accordion, ActionIcon, Avatar, Button, Container, Grid, Group, Modal, Notification, Paper, Select, Text, UnstyledButton } from "@mantine/core";
import { Check, Flag, Message, ThumbDown, ThumbUp } from "tabler-icons-react";
import { getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import moment from "moment";
import {setDoc, doc} from "firebase/firestore";
import { db } from "~config";

function Comment({ id, user, comment, createdAt, setReportNotification}){

    const [userData, setUserData] = useState({})
    
    const [opened, setOpened] = useState(false)

    const [reportReason, setReportReason] = useState("")

    const report = () => {
        setOpened(false)
        setReportNotification(false)
        const userRef = doc(db, `users/${user.id}`)
        const commentRef = doc(db, `comments/${id}`)
        setDoc(doc(db, "commentReports", userRef.id + commentRef.id), {
            reportReason,
            comment: commentRef,
            reportedBy: userRef
        })
        setTimeout(() => {
          setReportNotification(true)
        }, 5000)
    }


    const getUser = async () => {
        const docSnap = await getDoc(user);
        if(docSnap.exists()){
            const userData = docSnap.data();
            return userData;
        }
    }

    useEffect(() => {
        getUser().then(userData => {
            setUserData(userData)
        }).catch(err => { console.log(err) })
    }, [])

    return (
        <>
        <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Report Comment"
        >
        <Container>
          <Select
            label="Reason"
            placeholder="Pick one"
            required
            allowDeselect
            value={reportReason}
            onChange={setReportReason}
            data={[
              { value: 'commercial', label: 'Unwanted commericial content or spam' },
              { value: 'sexual', label: 'Pornography or sexually explicit material' },
              { value: 'abuse', label: 'Child abuse' },
              { value: 'hate', label: 'Hate speech or graphic violence' },
              { value: 'terrorism', label: "Promotes terrorism"},
              { value: 'harrassment', label: "Harassment or bullying"},
              { value: 'suicide', label: "Suicide or self injury"},
              { value: 'misinformation', label: "Misinformation"}
            ]}
          />
          <Button onClick={() => report()} mt="sm" color={"red"}>Report</Button>
        </Container>
      </Modal>
        <Paper mt="sm" shadow="sm" p="sm" withBorder={true}>
            <Grid columns={48}>
                <Grid.Col span={5}>
                    {userData.photoUrl ? <Avatar src={userData.photoUrl } radius="xl" mt="xs"></Avatar> : <Avatar radius="xl"></Avatar>}
                </Grid.Col>
                <Grid.Col span={43}>
                    <Text size="xs" color="dimmed">{userData.name}</Text>
                    <Text>{comment}</Text>
                </Grid.Col>
            </Grid>
            <Text mt="xs" size="xs" color="dimmed">{moment(createdAt).fromNow()}</Text>
            <Group spacing="xs" mt="xs">
            {/*<Button variant="outline" size="xs" leftIcon={<Message size={18}/>}>Reply</Button>*/}
                {/* <ActionIcon><ThumbUp size={18} color={"green"} /></ActionIcon>
                <Text>{likes}</Text>
                <ActionIcon><ThumbDown size={18} color={"red"} /></ActionIcon>
                <Text>{dislikes}</Text> */}
                <ActionIcon onClick={() => setOpened(true)}><Flag size={18} color={"orange"} /></ActionIcon>
            </Group>
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

export default Comment;