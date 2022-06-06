import { Accordion, ActionIcon, Avatar, Button, Grid, Group, Paper, Text, UnstyledButton } from "@mantine/core";
import { Flag, Message, ThumbDown, ThumbUp } from "tabler-icons-react";

function Comment({ id, userName, likes, dislikes, comment, replies}){
    return (
        <>
        <Paper key={id} mt="sm" shadow="sm" p="sm">
            <Grid columns={48}>
                <Grid.Col span={5}>
                    <Avatar color="cyan" radius="xl">{userName}</Avatar>
                </Grid.Col>
                <Grid.Col span={43}>
                    <Text>{comment}</Text>
                </Grid.Col>
            </Grid>
            <Group spacing="xs" mt="xs">
            <Button variant="outline" size="xs" leftIcon={<Message size={18}/>}>Reply</Button>
                <ActionIcon><ThumbUp size={18} color={"green"} /></ActionIcon>
                <Text>{likes}</Text>
                <ActionIcon><ThumbDown size={18} color={"red"} /></ActionIcon>
                <Text>{dislikes}</Text>
                {/*<ActionIcon onClick={() => setOpened(true)}><Flag size={18} color={"orange"} /></ActionIcon> */}
                <ActionIcon title="Report"><Flag size={18} color={"orange"} /></ActionIcon>
            </Group>
            
            <Accordion>
                <Accordion.Item label={`View ${replies.length} replies`}>
                  <Text>This is a long comment that someone posted and wants everyone to see. People like to write paragraphs. It is just how they are! Why do people even care? I have no clue!</Text>
                </Accordion.Item>
            </Accordion>
        </Paper>
        </>
    )
}

export default Comment;