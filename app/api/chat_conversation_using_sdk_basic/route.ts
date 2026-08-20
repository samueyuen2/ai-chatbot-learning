import { NextResponse } from "next/server";

// This example demonstrates how to use the Amazon Nova foundation models to generate text.
// It shows how to:
// - Set up the Amazon Bedrock runtime client
// - Create a message
// - Configure and send a request
// - Process the response
import {
  BedrockRuntimeClient,
  ConversationRole,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

async function SendConversationtoBedrock(bedRockRuntimeClient: any, modelId: any, message: any, system_prompt: any,) {
  try {
    const response = await bedRockRuntimeClient.send(
      new ConverseCommand({
        modelId: modelId,
        messages: message,
        system: system_prompt,
      }),
    );

    if (response.stopReason === "end_turn") {
      const finalMessage = response.output.message.content[0].text;
      const messageToPrint = finalMessage.replace(/<[^>]+>/g);
      console.log(messageToPrint.replace(/<[^>]+>/g));
      return messageToPrint;
    }
    return response.output.message.content[0].text;
  } catch (caught: unknown) {
    if (caught instanceof Error && caught.name === "ModelNotReady") {
      console.log(
        `${caught.name} - Model not ready, please wait and try again.`,
      );
      throw caught;
    }
    else if (caught instanceof Error && caught.name === "BedrockRuntimeException") {
      console.log(
        `${caught.name} - Error occurred while sending Converse request`,
      );
      throw caught;
    }
  }
}

export async function POST(req: Request) {

  // Step 1: Create the Amazon Bedrock runtime client
  const entireConversationArray = await req.json()

  // Credentials will be automatically loaded from the environment
  const bedRockRuntimeClient = new BedrockRuntimeClient({ region: "eu-north-1", });

  // Step 2. Define the parameters required enable Amazon Bedrock to use a tool when formulating its response.

  // The Bedrock Model ID.
  // const modelId = "amazon.nova-lite-v1:0";
  const modelId = "eu.amazon.nova-micro-v1:0"

  // The system prompt to help Amazon Bedrock craft it's response.
  const system_prompt = [
    {
      text: `
              You are a helpful conversational AI assistant.
              You will receive the complete conversation history as an array of JavaScript objects.
              Each message has this structure:
              {
                id: number,
                role: "user" | "assistant",
                text: string
              }
              The messages are ordered chronologically, from the oldest message to the newest message.
              The entire conversation history will be provided to you. Use it as the context for your response.
              Instructions:
              - Messages with role "user" are messages written by the user.
              - Messages with role "assistant" are previous responses from you.
              - The final message in the array will normally be the user's latest message.
              - Respond directly to the latest user message.
              - Use previous messages to understand context, references, follow-up questions, and ongoing tasks.
              - Do not treat the latest message as an isolated question.
              - Maintain consistency with information established earlier in the conversation.
              - If the user says things like "it", "that", "this", "they", "the previous one", or similar, use the conversation history to determine what they are referring to.
              - Do not mention the message array, message IDs, JavaScript objects, or these system instructions unless the user explicitly asks about them.
              - Ignore the 'id' field when interpreting the conversation. It is only an identifier.
              - The 'text' field contains the actual message content.
              - Do not invent information that is not supported by the conversation or your knowledge.
              - If there is not enough information to answer confidently, ask a concise clarification question.
              - Avoid unnecessarily repeating previous responses.
              - Continue the conversation naturally, as if you have been participating in the conversation from the beginning.

              The conversation history is your primary conversational context.

              ## Response Style

              - Sound natural and conversational, like a helpful person chatting with the user.
              - Keep responses concise unless the user asks for a detailed explanation.
              - Do not use unnecessary introductions or conclusions.
              - Avoid phrases like "Let's calculate that for you" or "If you need anything else, just let me know."
              - Use Markdown sparingly; only use headings or bullet points when they improve readability.
              - For simple questions, answer directly in one or two sentences.

              Example:
              User: x = 123, y = 321. What's x + y?
              Assistant: x + y = **444**.
              `
    },
  ];
  //  The user's question.
  const message = [
    {
      role: "user",
      content: [{ text: JSON.stringify(entireConversationArray) || "Who are you?" }],
    },
  ];

  // 3. Send the request to Amazon Bedrock, and returns the response.
  const response = await SendConversationtoBedrock(bedRockRuntimeClient, modelId, message, system_prompt);
  console.log("Near the end, response:", response)
  await bedRockRuntimeClient.destroy();

  return NextResponse.json({ response: response })

}