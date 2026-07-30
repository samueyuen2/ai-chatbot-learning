"use client"

import Image from "next/image";
import styles from "./../page.module.css";
import { useEffect, useState } from "react";

const sendMessageToModel = async () => {
  const res = await fetch(`/api/chat_single_fixed_message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: null
  })
  const data = await res.json()
  return data
}

export default function Chat() {
  const [message, setMessage] = useState("Click the button above to fetch response from AI model")

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className={styles.intro}>
          <h1>Chat Page</h1>
          <button onClick={async () => {
            if (!!message) {
              const res: { response: string } = await sendMessageToModel();
              if (!!res?.response) { setMessage(res?.response) }
            }
            else { alert("Cannot send empty message to model") }
          }}>
            Send Message to Model
          </button>
          {message}
        </div>
      </main>
    </div>
  );
}
