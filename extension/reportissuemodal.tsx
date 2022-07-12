import { Button, Container, Modal, Text, Textarea } from "@mantine/core"
import { useState } from "react"

import {
  errorToast,
  justASecondToastClose,
  justASecondToastOpen,
  reportThankYouToast
} from "~toasts"

function ReportIssueModal({ opened, setOpened }) {
  const [issueTitle, setIssueTitle] = useState("")
  const [issueDescription, setIssueDescription] = useState("")

  const report = async () => {
    justASecondToastOpen()
    const app = "grafitti"
    try {
      const response = await fetch(
        "https://report-bug-midvtuf5pq-uc.a.run.app/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: `{"title":"${issueTitle}","body":"${issueDescription}","app":"${app}"}`
        }
      )
      const data = await response.text()
      if (response.ok) {
        reportOk()
      } else {
        throw new Error(data)
      }
    } catch (err) {
      errorToast(err.message)
    } finally {
      justASecondToastClose()
    }
  }

  const reportOk = () => {
    reportThankYouToast()
    setIssueTitle("")
    setIssueDescription("")
    setOpened(false)
  }

  return (
    <>
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Report an Issue">
        <Container>
          <Textarea
            maxLength={100}
            label="Title"
            autosize
            required
            value={issueTitle}
            placeholder="Submitting a comment is not working"
            onChange={(e) => setIssueTitle(e.target.value)}
          />
          <Text size="xs" color="dimmed">
            {issueTitle.length} / 100
          </Text>
          <Textarea
            maxLength={500}
            autosize
            required
            label="Description of Issue"
            placeholder="I keep getting this error message when I try to submit a comment..."
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
          />
          <Text size="xs" color="dimmed">
            {issueDescription.length} / 500
          </Text>
          <Button
            disabled={issueDescription.length === 0 || issueTitle.length === 0}
            onClick={() => report()}
            mt="sm"
            color={"red"}>
            Report
          </Button>
        </Container>
      </Modal>
    </>
  )
}

export default ReportIssueModal
