import {
  BedrockRuntimeClient,
  ConversationRole,
  ConverseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";

const bedrockClient = new BedrockRuntimeClient({
  region: "eu-north-1",
});

const modelId = "eu.amazon.nova-micro-v1:0";

const systemPrompt = [
  {
    text: `
      You are a helpful, conversational AI assistant.

      Your job is to answer the user's questions clearly, accurately, and concisely.

      Guidelines:
      - Be friendly, natural, and conversational.
      - Answer the user's question directly.
      - Explain concepts clearly when the user is learning something.
      - Use examples when they make the explanation easier to understand.
      - If you are unsure about something, say so rather than making up information.
      - Maintain context from the conversation when relevant.
      - Do not unnecessarily repeat information.
      - Format responses using Markdown when useful.
    `,
  },
];

type FrontendMessage = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

export async function POST(req: Request) {
  const { message: newMessage, messages: messageHistory, }:
    { message: FrontendMessage; messages: FrontendMessage[]; }
    = await req.json();

  const messages = [...messageHistory, newMessage,]
    .map((message) => ({ role: message.role, content: [{ text: message.text }], }));

  const backendController = new AbortController();

  req.signal.addEventListener("abort", () => {
    console.log("Client request aborted");
    backendController.abort();
  });

  try {
    const response: any = await bedrockClient.send(
      new ConverseStreamCommand({
        modelId,
        messages,
        system: systemPrompt,
        inferenceConfig: {
          maxTokens: 500,
          temperature: 0.5,
        },
      }),
      {
        abortSignal: backendController.signal,
      }
    );

    if (!response.stream) {
      throw new Error("Bedrock did not return a stream");
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of response.stream) {
            const text = event.contentBlockDelta?.delta?.text;
            if (!text) { continue; }
            const data = `data: ${JSON.stringify({ text })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },

      cancel(reason) {
        console.log("ReadableStream cancelled:", reason);
        backendController.abort();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.log("Bedrock request aborted");
      return new Response(null, { status: 499, });
    }
    console.error("Bedrock request failed:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate response", }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", },
      }
    );
  }
}