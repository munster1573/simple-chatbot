"use client";

import { FormEvent, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const updatedMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      setMessages([...updatedMessages, { role: "assistant", content: data.reply }]);
    } catch (error: any) {
      setMessages([...updatedMessages, { role: "assistant", content: `Error: ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Simple Chatbot</h1>
      <div className="chat-box">
        {messages.map((message, index) => (
          <div key={index} className="message">
            <strong>{message.role === "user" ? "You" : "Bot"}:</strong> {message.content}
          </div>
        ))}
        {loading && (
          <div className="message">
            <strong>Bot:</strong> Thinking...
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button type="submit">Send</button>
      </form>
    </main>
  );
}
