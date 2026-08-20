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

export async function GET() {
  return NextResponse.json({ message: "Well Done!!" })
}


// Helper function to return the song and artist from top_song tool.
async function get_top_song(call_sign: unknown) {
  try {
    if (call_sign === "WZPZ") {
      const song = "Elemental Hotel";
      const artist = "8 Storey Hike";
      return { song, artist };
    }
  } catch (error: unknown) {
    if (error instanceof Error) { console.log(error.message); }
  }
}


async function SendConversationtoBedrock(bedRockRuntimeClient: any, modelId: any, message: any, system_prompt: any, tool_config: any) {
  try {
    const response = await bedRockRuntimeClient.send(
      new ConverseCommand({
        modelId: modelId,
        messages: message,
        system: system_prompt,
        toolConfig: tool_config,
      }),
    );
    if (response.stopReason === "tool_use") {
      console.log("tool_use")
      const toolResultFinal = [];
      try {
        const output_message = response.output.message;
        message.push(output_message);
        const toolRequests = output_message.content;
        const toolMessage = toolRequests[0].text;
        console.log(toolMessage.replace(/<[^>]+>/g, ""));
        for (const toolRequest of toolRequests) {
          if (Object.hasOwn(toolRequest, "toolUse")) {
            const toolUse = toolRequest.toolUse;
            const toolUseID = toolUse.toolUseId;
            console.log(`Requesting tool ${toolUse.name}, Tool use id ${toolUseID}`,);
            if (toolUse.name === "top_song") {
              try {
                const top_song = await get_top_song(toolUse.input.sign).then((top_song) => top_song);
                const toolResult = {
                  toolResult: {
                    toolUseId: toolUseID,
                    content: [
                      { json: { song: top_song?.song, artist: top_song?.artist }, },
                    ],
                  },
                };
                toolResultFinal.push(toolResult);
              } catch (err: unknown) {
                const toolResult = {
                  toolUseId: toolUseID,
                  content: [{ json: { text: err instanceof Error ? err.message : undefined } }],
                  status: "error",
                };
              }
            }
          }
        }
        const toolResultMessage = { role: "user", content: toolResultFinal, };
        // Step 4. Add the tool response to the conversation, and send it back to Amazon Bedrock.
        message.push(toolResultMessage);
        return await SendConversationtoBedrock(bedRockRuntimeClient, modelId, message, system_prompt, tool_config,);
      } catch (caught: unknown) {
        if (caught instanceof Error) { console.log(caught.message); }
        throw caught;
      }
    }

    // Translate Apple into chinese
    // 4. Publish the response.
    if (response.stopReason === "end_turn") {
      // console.log("end_turn")
      // const finalMessage = response.output.message.content[0].text;
      // console.log("\n\n")
      // console.log("response.output.message.content:", response.output.message.content)
      // // console.log("response.output.message.content[0].text:", response.output.message.content[0].text)
      // console.log("\n\n")

      // const match = finalMessage.match(/<response>([\s\S]*?)<\/response>/);

      // const messageToPrint = match
      //   ? match[1].trim()
      //   : finalMessage.replace(/<thinking>[\s\S]*?<\/thinking>/, "").trim();
      // return messageToPrint;

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


// This example demonstrates how to send a conversation of messages to Amazon Nova using Bedrock's Converse API with a tool configuration.
// It shows how to:
// - 1. Set up the Amazon Bedrock runtime client
// - 2. Define the parameters required enable Amazon Bedrock to use a tool when formulating its response (model ID, user input, system prompt, and the tool spec)
// - 3. Send the request to Amazon Bedrock, and returns the response.
// - 4. Add the tool response to the conversation, and send it back to Amazon Bedrock.
// - 5. Publish the response.
export async function POST(req: Request) {

  // Step 1: Create the Amazon Bedrock runtime client
  const body = await req.json()

  // Credentials will be automatically loaded from the environment
  const bedRockRuntimeClient = new BedrockRuntimeClient({ region: "eu-north-1", });

  // Step 2. Define the parameters required enable Amazon Bedrock to use a tool when formulating its response.

  // The Bedrock Model ID.
  // const modelId = "amazon.nova-lite-v1:0";
  const modelId = "eu.amazon.nova-micro-v1:0"

  // The system prompt to help Amazon Bedrock craft it's response.
  const system_prompt = [
    {
      text:
        "You are a music expert that provides the most popular song played on a radio station, using only the\n" +
        "the top_song tool, which he call sign for the radio station for which you want the most popular song. " +
        "Example calls signs are WZPZ and WKRP. \n" +
        "- Only use the top_song tool. Never guess or make up information. \n" +
        "- If the tool errors, apologize, explain weather is unavailable, and suggest other options.\n" +
        "- Only respond to queries about the most popular song played on a radio station\n" +
        "Remind off-topic users of your purpose. \n" +
        "- Never claim to search online, access external data, or use tools besides the top_song tool.\n" +
        ///// HERE /////
        "- Do not output your reasoning or internal analysis.\n" +
        "- Do not use <thinking>, <response>, XML, or other wrapper tags.\n" +
        "- Return only the final answer intended for the user.\n",
        ///// HERE /////
    },
  ];
  //  The user's question.
  const message = [
    {
      role: "user",
      content: [{ text: body || "What is the most popular song on WZPZ?" }],
    },
  ];
  // The tool specification. In this case, it uses an example schema for
  // a tool that gets the most popular song played on a radio station.
  const tool_config = {
    tools: [
      {
        toolSpec: {
          name: "top_song",
          description: "Get the most popular song played on a radio station.",
          inputSchema: {
            json: {
              type: "object",
              properties: {
                sign: {
                  type: "string",
                  description:
                    "The call sign for the radio station for which you want the most popular song. Example calls signs are WZPZ and WKRP.",
                },
              },
              required: ["sign"],
            },
          },
        },
      },
    ],
  };

  // 3. Send the request to Amazon Bedrock, and returns the response.
  const response = await SendConversationtoBedrock(bedRockRuntimeClient, modelId, message, system_prompt, tool_config);
  console.log("Near the end, response:", response)
  await bedRockRuntimeClient.destroy();

  return NextResponse.json({ response: response })

}