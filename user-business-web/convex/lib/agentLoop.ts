import { fetchFireworksWithRetry } from "./fireworksFetch";

export type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | Array<Record<string, unknown>>;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
};

export type ToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

type Usage = {
  prompt_tokens?: number;
  completion_tokens?: number;
};

type CompletionResponse = {
  choices: Array<{
    message: {
      content: string | null;
      tool_calls?: ToolCall[];
    };
    finish_reason?: string;
  }>;
  usage?: Usage;
};

function chatCompletionsUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/$/, "");
  if (trimmed.endsWith("/v1")) {
    return `${trimmed}/chat/completions`;
  }
  return `${trimmed}/v1/chat/completions`;
}

function mergeUsage(total: Usage, next?: Usage): Usage {
  if (!next) return total;
  return {
    prompt_tokens: (total.prompt_tokens ?? 0) + (next.prompt_tokens ?? 0),
    completion_tokens: (total.completion_tokens ?? 0) + (next.completion_tokens ?? 0),
  };
}

export async function runToolCallingChat(options: {
  baseUrl: string;
  apiKey?: string;
  model: string;
  messages: ChatMessage[];
  tools: ToolDefinition[];
  maxRounds?: number;
  maxTokens?: number;
  executeTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}): Promise<{
  answer: string;
  usage: Usage;
  rounds: number;
}> {
  const maxRounds = options.maxRounds ?? 4;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options.apiKey) {
    headers.Authorization = `Bearer ${options.apiKey}`;
  }

  const workingMessages = [...options.messages];
  let usage: Usage = {};
  let rounds = 0;

  for (let round = 0; round < maxRounds; round += 1) {
    rounds = round + 1;
    const body: Record<string, unknown> = {
      model: options.model,
      messages: workingMessages,
      tools: options.tools,
      tool_choice: "auto",
      max_tokens: options.maxTokens ?? 500,
    };

    const resp = await fetchFireworksWithRetry(chatCompletionsUrl(options.baseUrl), {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = (await resp.json()) as CompletionResponse;
    usage = mergeUsage(usage, data.usage);

    const choice = data.choices[0];
    if (!choice) {
      throw new Error("LLM returned no choices");
    }

    const assistantMessage = choice.message;
    const toolCalls = assistantMessage.tool_calls ?? [];

    if (toolCalls.length === 0) {
      return {
        answer: assistantMessage.content?.trim() ?? "",
        usage,
        rounds,
      };
    }

    workingMessages.push({
      role: "assistant",
      content: assistantMessage.content ?? "",
      tool_calls: toolCalls,
    });

    for (const call of toolCalls) {
      let parsedArgs: Record<string, unknown> = {};
      try {
        parsedArgs = JSON.parse(call.function.arguments) as Record<string, unknown>;
      } catch {
        parsedArgs = {};
      }
      const result = await options.executeTool(call.function.name, parsedArgs);
      workingMessages.push({
        role: "tool",
        tool_call_id: call.id,
        name: call.function.name,
        content: JSON.stringify(result),
      });
    }
  }

  return {
    answer:
      "I found some menu info but need a simpler question — try asking about a specific dish at La Parada.",
    usage,
    rounds,
  };
}
