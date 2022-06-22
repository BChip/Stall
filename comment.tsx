import { Accordion, ActionIcon, Avatar, Button, Grid, Group, Paper, Text, UnstyledButton } from "@mantine/core";
import { Flag, Message, ThumbDown, ThumbUp } from "tabler-icons-react";
import { getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import moment from "moment";

function Comment({ id, user, comment, createdAt}){

    const [userData, setUserData] = useState({})

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
        <Paper key={id} mt="sm" shadow="sm" p="sm" withBorder={true}>
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
                {/*<ActionIcon onClick={() => setOpened(true)}><Flag size={18} color={"orange"} /></ActionIcon> */}
                <ActionIcon title="Report"><Flag size={18} color={"orange"} /></ActionIcon>
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