"use client";

import styles from "./../page.module.css";
import { useState } from "react";

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

const sendMessageToModel = async (payload: { message: Message, messages: Message[] }) => {
  const res = await fetch("/api/chat_conversation_using_sdk_basic", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Failed to send message");
  }

  return res.json();
};

export default function Chat() {
  const [chatboxHeader, setChatboxHeader] = useState("Chat");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = message.trim();
    if (!text || isLoading) { return; }

    const userMessage: Message = { id: Date.now(), role: "user", text, };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      const res: { response: string } = await sendMessageToModel({ message: userMessage, messages });

      if (res?.response) {
        const assistantMessage: Message = {
          id: Date.now() + 1,
          role: "assistant",
          text: res.response,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Chat error:", error);

      const errorMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        text: "Sorry, something went wrong. Please try again.",
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Chat Page</h1>

          <div className="chatbox">
            <div className="chatbox__header">
              {chatboxHeader}
            </div>

            <div className="chatbox__messages">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chatbox__message chatbox__message--${msg.role}`}
                >
                  {`${msg.text}`}
                </div>
              ))}

              {isLoading && (
                <div className="chatbox__message chatbox__message--assistant">
                  Thinking...
                </div>
              )}
            </div>

            <form
              className="chatbox__input-area"
              onSubmit={handleSubmit}
            >
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                aria-label="Message"
                disabled={isLoading}
              />

              <button type="submit" disabled={isLoading}>
                {isLoading ? "..." : "Send"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}