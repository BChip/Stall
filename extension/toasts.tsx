import { showNotification, updateNotification } from "@mantine/notifications"
import { AlertCircle, Check, Send } from "tabler-icons-react"

export function reportThankYouToast() {
  showNotification({
    title: "Thank you!",
    color: "teal",
    icon: <Check />,
    message: "We will review it and take appropriate action."
  })
}

export function errorToast(message) {
  showNotification({
    title: "Uh oh!",
    color: "red",
    icon: <AlertCircle />,
    message: message
  })
}

export function successToast(message) {
  showNotification({
    title: "Success!",
    color: "teal",
    icon: <Check />,
    message: message
  })
}

export function tooManyRequests() {
  showNotification({
    title: "Uh oh!",
    color: "red",
    icon: <AlertCircle />,
    message:
      "You are sending too many requests... Please try again in a few minutes..."
  })
}

export function justASecondToastOpen() {
  showNotification({
    id: "just-a-second",
    title: "Just a second...",
    message: "We are processing your request.",
    loading: true,
    autoClose: 30000
  })
}

export function justASecondToastClose() {
  updateNotification({
    id: "just-a-second",
    title: "Just a second...",
    message: "We are processing your request.",
    loading: true,
    autoClose: 50
  })
}
