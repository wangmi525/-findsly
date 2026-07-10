import Groq from "groq-sdk";
let groq: Groq | null = null;
export function getGroq() {
  if (!groq) groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  return groq;
}
