import { inngest } from "@/inngest/client";

type QueryRequestedEvent = {
  name: "query/requested";
  data: {
    runId: string;
    prompt: string;
    sessionId: string;
  };
};

export const queryProcessor = inngest.createFunction(
  {
    id: "query-processor",
    retries: 2,
    triggers: [{ event: "query/requested" as QueryRequestedEvent["name"] }],
  },
  async ({ event, step }) => {
    const { prompt, runId, sessionId } = event.data;

    await step.run("mark-running", async () => {
      console.log("Running query", { runId, sessionId, prompt });
    });

    const result = await step.run("build-response", async () => {
      return {
        summary:
          "Query processor scaffold is active. Connect planner and executor next.",
        chart: null,
      };
    });

    await step.run("mark-completed", async () => {
      console.log("Completed query", { runId, sessionId });
    });

    return result;
  }
);
