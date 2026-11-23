// Rate limits. Port of the Limits class in server.py.
//
// The counters live in memory. On a serverless host that means they hold per warm instance: each
// instance counts for itself, and a new or restarted instance starts from zero. They slow a
// burst down; they are not an exact cap across the whole deployment.
import { EMAIL, GLOBAL_MODEL_CALLS_PER_DAY, RATE_PER_DAY, RATE_PER_MINUTE } from "./generated";

const DAY_S = 86400;

export interface ClientCheck {
  allowed: boolean;
  retryAfter: number;   // seconds
  sentence: string;
}

export class Limits {
  private readonly hits = new Map<string, number[]>();
  private readonly modelCalls: number[] = [];

  /** `now` returns the time in seconds, like Python's time.time(). */
  constructor(private readonly now: () => number = () => Date.now() / 1000) {}

  /** Record one question for this client. */
  checkClient(ip: string): ClientCheck {
    const now = this.now();
    if (this.hits.size > 5000) {
      for (const [k, d] of [...this.hits]) {
        if (!d.length || d[d.length - 1] < now - DAY_S) this.hits.delete(k);
      }
    }
    let dq = this.hits.get(ip);
    if (!dq) {
      dq = [];
      this.hits.set(ip, dq);
    }
    while (dq.length && dq[0] <= now - DAY_S) dq.shift();
    if (dq.length >= RATE_PER_DAY) {
      const wait = Math.max(1, Math.ceil(dq[0] + DAY_S - now));
      return {
        allowed: false,
        retryAfter: wait,
        sentence: `You have reached the limit of ${RATE_PER_DAY} questions a day. Try again tomorrow, or email ${EMAIL}.`,
      };
    }
    const recent = dq.slice(-RATE_PER_MINUTE).filter((t) => t > now - 60);
    if (recent.length >= RATE_PER_MINUTE) {
      const wait = Math.max(1, Math.ceil(recent[0] + 60 - now));
      return {
        allowed: false,
        retryAfter: wait,
        sentence: `That is a lot of questions in a short time. Try again in ${wait} seconds.`,
      };
    }
    dq.push(now);
    return { allowed: true, retryAfter: 0, sentence: "" };
  }

  /** Count one upstream attempt against the global daily cap. False when the cap is reached. */
  takeModelCall(): boolean {
    const now = this.now();
    while (this.modelCalls.length && this.modelCalls[0] <= now - DAY_S) this.modelCalls.shift();
    if (this.modelCalls.length >= GLOBAL_MODEL_CALLS_PER_DAY) return false;
    this.modelCalls.push(now);
    return true;
  }
}
