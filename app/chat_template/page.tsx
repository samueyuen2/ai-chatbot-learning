"use client"

import Image from "next/image";
import styles from "./../page.module.css";
import { useEffect, useState } from "react";

const getMessage = async (name?: string) => {
  const res = await fetch(`/api/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name ?? "Sam" })
  })
  const data = await res.json()
  return data
}

export default function Chat() {
  const [message, setMessage] = useState("")

  useEffect(() => {
    const loadMessage = async () => {
      const initRes = await getMessage();
      setMessage(initRes.message);
    };

    loadMessage();
    console.log(message)
  }, []);

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
          <button onClick={async () => { setMessage((await getMessage("Tom"))?.message) }}>click me</button>
          {message}
          {/* {!!response && response?.message} */}
        </div>
      </main>
    </div>
  );
}
