// Static sample content for Part 1. Part 2 will replace these with computed results.
// A paragraph is a list of segments; a segment with `rank` is a highlighted sentence.
export type Segment = { text: string; rank?: number };

export const paragraphs: Segment[][] = [
  [{ text: "Technology has always been a driving force behind human progress. From the invention of the wheel to the rise of the internet, each innovation has changed the way we live, work, and communicate. Today, we stand at the edge of a new era, where artificial intelligence is not just a tool, but a partner in our daily lives." }],
  [
    { text: "While the benefits of AI are undeniable, its rapid advancement also raises important questions about privacy, security, and the future of work.", rank: 1 },
    { text: " Many experts believe that as machines become more capable, we must also think about how to ensure they are used responsibly and ethically." },
  ],
  [{ text: "Education, healthcare, and transportation are just a few of the areas being transformed by this technology. In classrooms, AI personalizes learning experiences. In hospitals, it helps doctors make faster and more accurate decisions. On the roads, it powers safer and smarter transportation systems." }],
  [
    { text: "However, the path to a fully AI-powered world is not without challenges, as it requires significant investment, infrastructure, and a skilled workforce.", rank: 2 },
    { text: " Governments, businesses, and individuals must work together to bridge the digital divide and ensure that the benefits of AI are accessible to everyone." },
  ],
  [{ text: "Despite the challenges, the potential is enormous. With the right policies and a focus on human well-being, AI can help create a more inclusive, efficient, and sustainable future for all." }],
  [
    { text: "Ultimately, the success of AI will not be measured by how advanced it becomes, but by how well it improves the lives of people around the world.", rank: 3 },
    { text: " It is not just about smarter machines, but about a smarter, kinder, and more connected society." },
  ],
  [
    { text: "In the coming years, we will likely see even more breakthroughs, from advanced robotics to AI-driven scientific discoveries.", rank: 4 },
    { text: " " },
    { text: "The real challenge, then, is not just creating smarter technology, but using it wisely, fairly, and compassionately.", rank: 5 },
  ],
  [{ text: "As we move forward, it is essential to stay informed, remain open to change, and continue the conversation about what kind of future we want to build together. The journey may be complex, but it is also full of opportunity, and it starts with the choices we make today." }],
];

export const difficultWordList = ["advancement", "infrastructure", "inclusive", "breakthroughs"];

export const readability = {
  score: 62,
  label: "Fairly Difficult",
  description:
    "This text is somewhat challenging to read. It may be difficult for younger readers or those with limited experience in the subject.",
};

export type Level = "Very Hard" | "Hard" | "Moderate";

export const hardestSentences: { rank: number; preview: string; reason: string; level: Level }[] = [
  { rank: 1, preview: "While the benefits of AI are undeniable, its rapid advancement…", reason: "Complex structure + multiple ideas", level: "Very Hard" },
  { rank: 2, preview: "However, the path to a fully AI-powered world is not without…", reason: "Long sentence + technical vocabulary", level: "Hard" },
  { rank: 3, preview: "Ultimately, the success of AI will not be measured by how…", reason: "Complex structure + abstract concepts", level: "Hard" },
  { rank: 4, preview: "In the coming years, we will likely see even more breakthroughs…", reason: "Long sentence + multiple clauses", level: "Moderate" },
  { rank: 5, preview: "The real challenge, then, is not just creating smarter…", reason: "Complex structure + abstract concepts", level: "Moderate" },
];

export const difficultWords = [
  { word: "advancement", pos: "noun", def: "the act of making progress; improvement." },
  { word: "infrastructure", pos: "noun", def: "basic systems and services needed for a country or organisation." },
  { word: "inclusive", pos: "adjective", def: "including everyone; not excluding any group." },
  { word: "breakthroughs", pos: "noun", def: "a major discovery or development." },
];

export const sampleFile = { name: "Chapter_1.docx", chars: 2486, max: 10000 };
