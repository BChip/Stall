import { Button, Container, Modal, Select } from "@mantine/core"
import { useState } from "react"

import { createCommentReport } from "../db/firebase"
import {
  errorToast,
  reportThankYouToast,
  tooManyRequests
} from "../utilities/toasts"

interface Props {
  opened: boolean
  setOpened: unknown
  user: any
  commentId: string
}

function ReportCommentModal({ opened, setOpened, user, commentId }: Props) {
  const [reportReason, setReportReason] = useState("")

  const report = async () => {
    try {
      await createCommentReport(reportReason, user, commentId)
    } catch (err: unknown) {
      if (err.message.includes("permissions")) {
        tooManyRequests()
      } else {
        errorToast(err.message)
      }

      return
    }
    setOpened(false)
    reportThankYouToast()
  }

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
            onChange={() => setReportReason}
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
          <Button onClick={() => void report()} mt="sm" color={"red"}>
            Report
          </Button>
        </Container>
      </Modal>
    </>
  )
}

export default ReportCommentModal
