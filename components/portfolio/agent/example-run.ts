import type { AgentEvent, FitResult, NodeId } from "./agent-types";

/**
 * A clearly-labeled EXAMPLE run for the idle state and the over-cap "resting"
 * fallback. It is always shown behind an explicit "example" label and never
 * passed off as a live run — live runs only ever come from /api/fit. (The live
 * trace is never faked; this is a separate, honest demonstration.) It mirrors the
 * real shape — including the parallel gather band — so the UI looks true.
 */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Step {
  node: NodeId;
  label: string;
  reasoning: string;
  status?: string;
  summary: string;
}

const LINEAR_PRE: Step[] = [
  { node: "intake", label: "intake", reasoning: "Reading the posting — a forward-deployed / AI engineer role. It wants someone who ships across the stack and the model layer.", status: "company: example co.", summary: "role parsed" },
  { node: "fit_gate", label: "fit gate", reasoning: "Is there an honest path from Manan's background here? Clearly yes — this is squarely engineering + AI.", summary: "strong" },
  { node: "plan", label: "plan", reasoning: "Dimensions worth proving: AI infra / MCP, ships fast under constraints, full-stack breadth.", summary: "3 dimensions" },
];

const BAND: Step[] = [
  { node: "work_history", label: "work history", reasoning: "Amazon — built the org's single-source-of-truth MCP server architecture. Strong infra signal.", status: "selected 2 of 3", summary: "2 selected" },
  { node: "projects", label: "projects", reasoning: "ScriptSync (CV + synced audio, hackathon winner), ForReal. (93%+ deepfake detector).", status: "selected 3 of 9", summary: "3 selected" },
  { node: "web_corpus", label: "web corpus", reasoning: "Cross-referencing the company against his skills and repeat hackathon wins.", status: "3 sources", summary: "corpus + web" },
];

const LINEAR_POST: Step[] = [
  { node: "synthesize", label: "synthesize", reasoning: "Mapping the MCP infra work and the shipped projects onto the role's requirements.", summary: "draft ready" },
  { node: "critique", label: "critique", reasoning: "Is every claim backed by a real evidence item? Yes — no hallucinated points. Grounded.", summary: "grounded — no gaps" },
  { node: "compose", label: "compose", reasoning: "Writing the verdict, citing only real evidence.", summary: "strong" },
];

const RESULT: FitResult = {
  verdict: "strong",
  paragraph:
    "Manan is a strong fit. At Amazon he built the org's single-source-of-truth MCP server architecture — the exact AI infrastructure forward-deployed teams need — and at Kello he does it on a small, fast team. His projects back the breadth: ScriptSync (CV + synced audio, a hackathon winner) and ForReal. (a 93%+ deepfake detector). He's a repeat hackathon winner who turns ideas into working systems in days.",
  evidence: [
    { label: "MCP architecture @ Amazon", href: "#experience" },
    { label: "ScriptSync", href: "#work" },
    { label: "ForReal.", href: "#work" },
  ],
  company: "Example Co.",
};

function* words(text: string): Generator<string> {
  for (const w of text.split(" ")) yield `${w} `;
}

async function* linear(steps: Step[]): AsyncGenerator<AgentEvent, void, void> {
  for (const step of steps) {
    yield { type: "node_start", node: step.node, label: step.label };
    await sleep(120);
    for (const c of words(step.reasoning)) {
      yield { type: "node_reasoning", node: step.node, delta: c };
      await sleep(16);
    }
    if (step.status) yield { type: "node_status", node: step.node, detail: step.status };
    await sleep(80);
    yield { type: "node_done", node: step.node, summary: step.summary };
    await sleep(60);
  }
}

export async function* runExample(): AsyncGenerator<AgentEvent, FitResult, void> {
  yield* linear(LINEAR_PRE);

  // The parallel band: all three start together, stream interleaved, finish
  // independently — so the parallelism is visible, like a real run.
  for (const step of BAND) yield { type: "node_start", node: step.node, label: step.label };
  await sleep(140);
  const tokenStreams = BAND.map((s) => words(s.reasoning));
  let live = true;
  while (live) {
    live = false;
    for (let i = 0; i < BAND.length; i++) {
      const n = tokenStreams[i].next();
      if (!n.done) {
        live = true;
        yield { type: "node_reasoning", node: BAND[i].node, delta: n.value };
      }
    }
    await sleep(22);
  }
  for (let i = 0; i < BAND.length; i++) {
    if (BAND[i].status) yield { type: "node_status", node: BAND[i].node, detail: BAND[i].status! };
    await sleep(90 + i * 120); // finish at staggered times
    yield { type: "node_done", node: BAND[i].node, summary: BAND[i].summary };
  }

  yield* linear(LINEAR_POST);
  return RESULT;
}
