import { useState } from "react"
import { ActionIcon, Select, Avatar, Button, ColorScheme, ColorSchemeProvider, Container, Divider, Grid, Group, MantineProvider, Modal, Paper, ScrollArea, Text, Textarea, Notification, Accordion } from "@mantine/core";
import {Sun, MoonStars, ThumbUp, ThumbDown, Flag, Check, Message} from "tabler-icons-react";
import abbreviate from "~abbreviate";
import Comment from "~comment";

function IndexPopup() {
  //generate random number between 1000 and 10000000
  const randomNum: string = abbreviate(Math.floor(Math.random() * (10000000 - 1000 + 1)) + 1000, 0);
  const [data, setData] = useState("")
  const [colorScheme, setColorScheme] = useState<ColorScheme>("light")
  const [numberOfLikes, setNumberOfLikes] = useState(randomNum)
  const [numberOfDislikes, setNumberOfDislikes] = useState(randomNum)
  const [error, setError] = useState("")
  const [userName, setUserName] = useState("BC")
  const [opened, setOpened] = useState(false)
  const [reportNotification, setReportNotification] = useState(true)
  const dark = colorScheme === "dark"
  const toggleColorScheme = (value?: ColorScheme) => {
    setColorScheme(value || (colorScheme === "light" ? "dark" : "light"))
  }
  
  const report = () => {
    setOpened(false)
    setReportNotification(false)
    // setReportNotification(false) after 5 seconds
    setTimeout(() => {
      setReportNotification(true)
    }, 5000)
  }
  

  return (
    <div style={{minWidth: "500px"}}>
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
      
    <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
    <MantineProvider theme={{ colorScheme }} withNormalizeCSS withGlobalStyles>
    <Container>
      <ActionIcon variant="outline" color={dark?'yellow':'blue'} onClick={() => toggleColorScheme()} title="Toggle color schema">{dark ? <Sun size={18} />: <MoonStars size={18} />}</ActionIcon>
      <Group spacing="xs" mt="xs">
        <ActionIcon><ThumbUp size={18} color={"green"} /></ActionIcon>
        <Text>{numberOfLikes}</Text>
        <ActionIcon><ThumbDown size={18} color={"red"} /></ActionIcon>
        <Text>{numberOfDislikes}</Text>
      </Group>
      <Divider mt="sm"/>
      <Group mt="sm">
        <Textarea autosize placeholder="Your comment" error={error} required style={{width: "350px"}}/>
        <Button>Submit</Button>
      </Group>
      <Divider mt="sm" mb="sm"/>
      <Text>Comments:</Text>
      <ScrollArea style={{ height: 250 }}>
        {[...Array(10)].map((_, i) => (
          <Comment id={i} userName={userName} likes={numberOfLikes} dislikes={numberOfDislikes} comment={"LOL! This is a long comment that someone posted and wants everyone to see. People like to write paragraphs. It is just how they are! Why do people even care? I have no clue!"} replies={[]}/>
        ))}
      
      </ScrollArea>
    </Container>
    <Notification hidden={reportNotification} icon={<Check size={18} />} color="teal" title="Thank you for reporting this comment.">
        We will review it and take appropriate action.
        </Notification>
    </MantineProvider>
    </ColorSchemeProvider>
    
    </div>
  )
}

export default IndexPopup
