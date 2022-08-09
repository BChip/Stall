import type { DocumentReference } from "firebase/firestore";

export interface Comment {
  id: string;
  text: string;
  user: DocumentReference;
  url: string;
  hidden: boolean;
  createdAt: Date;
  updatedAt: Date;
}
