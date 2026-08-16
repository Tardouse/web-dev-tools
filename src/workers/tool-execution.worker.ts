import { assertToolOutputLimit, ToolLimitError } from "@/lib/tool-limits";
import { executeToolWorkerRequest } from "@/lib/tool-worker-operations";
import {
  collectTransferables,
  type ToolWorkerEnvelope,
  type ToolWorkerReply,
} from "@/lib/tool-worker-protocol";

interface WorkerScope {
  onmessage: ((event: MessageEvent<ToolWorkerEnvelope>) => void) | null;
  postMessage(message: ToolWorkerReply, transfer: Transferable[]): void;
}

const scope = self as unknown as WorkerScope;

scope.onmessage = async (event) => {
  try {
    const result = await executeToolWorkerRequest(event.data.request);
    assertToolOutputLimit(result, event.data.maxOutputSize);
    scope.postMessage({ ok: true, result }, collectTransferables(result));
  } catch (caught) {
    const error =
      caught instanceof Error ? caught : new Error("Tool worker failed.");
    scope.postMessage(
      {
        ok: false,
        error: {
          name: error.name,
          message: error.message,
          ...(error instanceof ToolLimitError ? { code: error.code } : {}),
        },
      },
      [],
    );
  }
};
