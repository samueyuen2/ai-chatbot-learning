"use client";

import styles from "./../page.module.css";
import { useRef, useState } from "react";

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

export default function Chat() {
  const [chatboxHeader] = useState("Chat");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  const handleStop = async () => {
    if (!readerRef.current) { return; }
    await readerRef.current.cancel();
    readerRef.current = null;
    setIsLoading(false);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = message.trim();
    if (!text || isLoading) { return; }

    const userMessage: Message = { id: Date.now(), role: "user", text, };
    const assistantId = Date.now() + 1;
    setMessages((prev) => [...prev, userMessage, { id: assistantId, role: "assistant", text: "", },]);
    setMessage("");
    setIsLoading(true);

    try {
      const res = await fetch(
        "/api/chat_streaming_using_sdk_basic",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", },
          body: JSON.stringify({ message: userMessage, messages, }),
        }
      );

      if (!res.ok) { throw new Error("Failed to send message"); }
      if (!res.body) { throw new Error("No response body"); }

      const reader = res.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();

        if (done) { break; }

        buffer += decoder.decode(value, { stream: true, });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          if (!event.startsWith("data:")) { continue; }
          const json = event.slice("data:".length).trim();
          const data = JSON.parse(json);
          if (!data.text) { continue; }
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? {
                  ...msg,
                  text: msg.text + data.text,
                }
                : msg
            )
          );
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      readerRef.current = null;
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
                  {msg.text}
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

              {isLoading ? (
                <button type="button" onClick={handleStop}>
                  Stop
                </button>
              ) : (
                <button type="submit">
                  Send
                </button>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}