// The Cloud Functions for Firebase SDK to create Cloud Functions and set up triggers.
const functions = require("firebase-functions")

// The Firebase Admin SDK to access Firestore.
const admin = require("firebase-admin")
admin.initializeApp()

const THRESHOLD = 1

const reports = {} as { [key: string]: any }

interface CommentReport {
  comment: string
  reportReason: string
  reportedBy: string
}

exports.scheduledCommentReportingJob = functions.pubsub
  .schedule("every 24 hours")
  .timeZone("America/New_York")
  .onRun((context: any) => {
    // This will be executed every 24 hours
    console.log("This will be executed every 24 hours")

    console.log("THRESHOLD = ", THRESHOLD)

    // Get a reference to the database service
    const db = admin.firestore()

    // Get a reference to the commentReports collection
    const commentReportsRef = db.collection("commentReports")

    // Get documents from the commentReports collection
    commentReportsRef.get().then((snapshot: any) => {
      // Loop through the documents
      snapshot.forEach((commentReportDoc: any) => {
        // Get the commentReport data
        const commentReport = commentReportDoc.data()

        // Get comment id reference in commentReports document
        const commentId = commentReport.comment.id

        // vDFfMOMaQAt6K1GHkl5a
        console.log("Comment: " + commentId)

        // Check if exists in the reports object
        if (!reports[commentReport.comment]) {
          // If not, create it
          reports[commentId] = { commentReports: [] }
        }

        // Add the commentReport to the reports object
        // Example: reports["vDFfMOMaQAt6K1GHkl5a"] = { commentReports: ["UIrqHna0XUNqLLnUpMSmATmDVzV2vDFfMOMaQAt6K1GHkl5a", "ZdYU3EUvTFQoXkCg1dU6odEX0JY2jWntFxFaX1jrtmGiAKdS"] };
        reports[commentId] = {
          commentReports: [
            ...reports[commentId].commentReports,
            commentReportDoc.id
          ]
        }

        // "UIrqHna0XUNqLLnUpMSmATmDVzV2vDFfMOMaQAt6K1GHkl5a", "ZdYU3EUvTFQoXkCg1dU6odEX0JY2jWntFxFaX1jrtmGiAKdS"
        console.log(reports[commentId].commentReports.join(", "))
      })

      console.log(Object.keys(reports).length)
      // Loop through the reports
      for (const [key, value] of Object.entries(reports)) {
        // Get the report
        const report = value
        const commentReports = report.commentReports
        console.log(
          "Number of reports for: " + key + " = " + commentReports.length
        )
        if (commentReports.length >= THRESHOLD) {
          console.log("Deleting comment for violation: " + key)
          // Delete the comment for violations
          db.collection("comments").doc(key).delete()
          console.log("Deleting comment reports" + commentReports.join(", "))
          // Delete the commentReports - no longer needed because the comment has been deleted
          commentReports.forEach((commentReportId: string) => {
            db.collection("commentReports").doc(commentReportId).delete()
          })
        }
      }
    })

    return null
  })
