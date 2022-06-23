import { useEffect, useState } from "react"
import { ActionIcon, Select, Avatar, Button, ColorScheme, ColorSchemeProvider, Container, Divider, Grid, Group, MantineProvider, Modal, Paper, ScrollArea, Text, Textarea, Notification, Accordion, Loader } from "@mantine/core";
import {Sun, MoonStars, ThumbUp, ThumbDown, Flag, Check, Message} from "tabler-icons-react";
import abbreviate from "~abbreviate";
import Comment from "~comment";
import { getAuth, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from './config';
import { collection, addDoc, query, where, getDocs, serverTimestamp, orderBy, doc, setDoc, DocumentReference } from "firebase/firestore"; 
import { useLocalStorageValue } from "@mantine/hooks";

function Home() {

  //generate random number between 1000 and 10000000
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState(null);
  const randomNum: string = abbreviate(Math.floor(Math.random() * (10000000 - 1000 + 1)) + 1000, 0);
  const [colorScheme, setColorScheme] = useState<ColorScheme>("light")
  const [error, setError] = useState("")
  const [siteRef, setSiteRef] = useState({})
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [likes, setLikes] = useState(0);
  const [userLiked, setUserLiked] = useState(null);
  const [dislikes, setDislikes] = useState(0);
  const [opened, setOpened] = useState(false)
  const [reportNotification, setReportNotification] = useState(true)
  const dark = colorScheme === "dark"
  const [commentSort, setCommentSort] = useState("createdAt")
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

  const fetchSiteFeelings = async (user, siteRef) => {
    const siteFeelings = collection(db, "siteFeelings");
    const siteFeelingsQuery = query(siteFeelings, where("url", "==", siteRef));
    try{
      const querySnapshot = await getDocs(siteFeelingsQuery);
      const siteFeelings = querySnapshot.docs.map(doc => doc.data())
      const likes = siteFeelings.filter(siteFeeling => siteFeeling.like).length
      const dislikes = siteFeelings.filter(siteFeeling => !siteFeeling.like).length
      const userLiked = siteFeelings.find(siteFeeling => siteFeeling.user.id === user.uid)
      setLikes(likes)
      setDislikes(dislikes)
      console.log(userLiked)
      if(userLiked){
        setUserLiked(userLiked.like)
      }else{
        setUserLiked(null)
      }
      
    }catch(error){console.log(error)}

  }

  const fetchComments = async (siteRef, sort) => {
    const commentsRef = collection(db, "comments");
    const commentsQuery = query(commentsRef, where("url", "==", siteRef), orderBy(sort, "desc"));
    try{
      const querySnapshot = await getDocs(commentsQuery);
      const comments = querySnapshot.docs.map(doc => doc.data())
      setComments(comments);
    }catch(error){console.log(error)}
  }

  const createSite = async (tabUrl, b64Url) => {
    setDoc(doc(db, "sites", b64Url),{
      url: tabUrl
    })
  }

  const getCurrentTab = async () => {
    let queryOptions = { active: true, currentWindow: true };
    let tabs = await chrome.tabs.query(queryOptions);
    return tabs[0].url;
  }
  
  useEffect(() => {
    setIsLoading(true);
    const AuthCheck = onAuthStateChanged(auth, (user) => {
        if (user) {
            setUser(user);
            getCurrentTab().then(tabUrl => {
              const b64Url = Buffer.from(tabUrl).toString('base64').replace("/", "_")
              createSite(tabUrl, b64Url);
              const siteRef = doc(db, `sites/${b64Url}`)
              setSiteRef(siteRef)
              fetchSiteFeelings(user, siteRef).catch(err => {
                setError(err)
              })
              fetchComments(siteRef, commentSort).catch(err => {
                setError(err)
              })
              setIsLoading(false);
            })
            
        } else {
        }
    });

    return () => AuthCheck();
  }, [auth]);
  
  const createComment = async () => {
    try {
      const docRef = await addDoc(collection(db, "comments"), {
        text: comment,
        author: doc(db, `users/${user.uid}`),
        url: siteRef,
        createdAt: serverTimestamp(),
      });
      setComment("");
      fetchComments(siteRef, commentSort).catch(err => {
        setError(err)
      })
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }

  const vote = async (feeling) => {
    const userRef = doc(db, `users/${user.uid}`)
    await setDoc(doc(db, "siteFeelings", userRef.id + siteRef.id), {
      url: siteRef,
      user: userRef,
      like: feeling
    })
    fetchSiteFeelings(user ,siteRef).catch(err => {
      setError(err)
    }
    )
  }

  const setSort = (value) => {
    setCommentSort(value)
    fetchComments(siteRef, value);
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
    { /* <Button onClick={() => signOut(auth)}>Sign out</Button> */ }
    <Container>
      <ActionIcon variant="outline" color={dark?'yellow':'blue'} onClick={() => toggleColorScheme()} title="Toggle color schema">{dark ? <Sun size={18} />: <MoonStars size={18} />}</ActionIcon>
      {isLoading ? <Loader /> : 
      <Group spacing="xs" mt="xs">
        {userLiked !== null ? 
        <>
        <ActionIcon onClick={() => vote(true)}>{userLiked ? <ThumbUp size={18} fill={"green"} fillOpacity={0.3} color={"green"} /> : <ThumbUp size={18} color={"green"} />}</ActionIcon>
        <Text>{likes}</Text>
        <ActionIcon onClick={() => vote(false)}>{userLiked ? <ThumbDown size={18} color={"red"} /> : <ThumbDown size={18} fill={"red"} fillOpacity={0.3} color={"red"} /> }</ActionIcon>
        <Text>{dislikes}</Text>
        </>
      :
      <>
      <ActionIcon onClick={() => vote(true)}><ThumbUp size={18} color={"green"} /></ActionIcon>
        <Text>{likes}</Text>
        <ActionIcon onClick={() => vote(false)}><ThumbDown size={18} color={"red"} /></ActionIcon>
        <Text>{dislikes}</Text>
      </>
      }
        
      </Group>
      }
      <Divider mt="sm"/>
      <Group mt="sm">
        <Textarea autosize value={comment} maxLength={140} onChange={e => setComment(e.target.value)} placeholder="Your comment" error={error} required style={{width: "350px"}}/>
        <Button onClick={() => createComment()}>Submit</Button>
      </Group>
      <Text size="xs" color="dimmed">{comment.length} / 140</Text>
      <Divider mt="sm" mb="sm"/>
      {isLoading ? <Loader /> : 
      <>
      <Grid>
        <Grid.Col span={3}>
          <Text mt="xs">Comments:</Text>
        </Grid.Col>
        <Grid.Col offset={4} span={5}>
        <Select
          value={commentSort} onChange={(value) => setSort(value)}
          data={[
            { value: 'createdAt', label: 'Created At' },
            { value: 'text', label: 'Alphabetical' },
          ]}
        />
        </Grid.Col>
      </Grid>
      
      <ScrollArea style={{ height: 250 }}>
        {comments.map((comment, i) => (
          <Comment key={i} id={i} user={comment.author} comment={comment.text} createdAt={comment.createdAt.toDate().toISOString()}/>
        ))}
      
      </ScrollArea>
      </>
      }
      
    </Container>
    <Notification hidden={reportNotification} icon={<Check size={18} />} color="teal" title="Thank you for reporting this comment.">
        We will review it and take appropriate action.
        </Notification>
    </MantineProvider>
    </ColorSchemeProvider>
    
    </div>
  )
}

export default Home
