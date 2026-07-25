import { puter } from "@heyputer/puter.js";

export { puter };

export async function chat(
  prompt: string,
  model = "openai/gpt-5.5"
) {
  return await puter.ai.chat(prompt, { model });
}