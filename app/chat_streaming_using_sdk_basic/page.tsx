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
    console.log("STOP clicked");
    if (!readerRef.current) { return; }
    await readerRef.current.cancel();
    console.log("Frontend reader cancelled");
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
      console.log("Sending request");
      const res = await fetch(
        "/api/chat_streaming_using_sdk_basic",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", },
          body: JSON.stringify({ message: userMessage, messages, }),
        }
      );

      console.log("Response received");
      if (!res.ok) { throw new Error("Failed to send message"); }
      if (!res.body) { throw new Error("No response body"); }

      const reader = res.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        console.log("Waiting for reader.read()");
        const { value, done } = await reader.read();
        if (done) { console.log("Reader done"); break; }

        console.log("Chunk received");
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
      console.log("Frontend request finished");
      readerRef.current = null;
      setIsLoading(false);
    }
  };

  return (
    // <div className={styles.page}>
    //   <main className={styles.main}>
          <div className="chat__card">
            <div className="chat__header">
              <div className="chat__profile">
                <div className="chat__avatar">AI</div>
                <div>
                  <h2>{chatboxHeader}</h2>
                  <span>Online</span>
                </div>
              </div>
            </div>

            <div className="chat__messages">
              {messages.length === 0 && (
                <div className="chat__empty">
                  <div className="chat__empty-icon">💬</div>
                  <h3>Start a conversation</h3>
                  <p>Ask me anything and I'll respond in real time.</p>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat__row chat__row--${msg.role}`}
                >
                  {msg.role === "assistant" && (
                    <div className="chat__bubble-avatar">AI</div>
                  )}

                  <div className={`chat__bubble chat__bubble--${msg.role}`}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="chat__row chat__row--assistant">
                  <div className="chat__bubble-avatar">AI</div>
                  <div className="chat__bubble chat__bubble--assistant">
                    <div className="typing">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form className="chat__input" onSubmit={handleSubmit}>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message Chat..."
                aria-label="Message"
                disabled={isLoading}
              />

              {isLoading ? (
                <button
                  type="button"
                  onClick={handleStop}
                  className="chat__button chat__button--stop"
                >
                  Stop
                </button>
              ) : (
                <button type="submit" className="chat__button">
                  Send
                </button>
              )}
            </form>
          </div>
    //   </main>
    // </div>
  );
}