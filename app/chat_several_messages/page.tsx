"use client"

import Image from "next/image";
import styles from "./../page.module.css";
import { useEffect, useState } from "react";

const sendMessageToModel = async (message: string) => {
  const res = await fetch(`/api/chat_several_messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message)
  })
  const data = await res.json()
  return data
}

export default function Chat() {
  const [message, setMessage] = useState("")
  const [response, setResponse] = useState("")

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
          <input type={"text"} value={message} onChange={(e) => { setMessage(e.target.value); }} />
          <button onClick={async () => {
            const res: { response: string } = await sendMessageToModel(message);
            if (!!res?.response) { setResponse(res?.response) }
            setMessage("")
          }}>
            Send Message to Model
          </button>
          {!!response ? response : "Input something and ask AI!"}
        </div>
      </main>
    </div>
  );
}
