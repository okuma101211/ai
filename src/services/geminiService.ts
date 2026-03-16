import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result.split(",")[1]);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "ja", name: "Japanese" },
  { code: "zh", name: "Chinese" },
  { code: "ko", name: "Korean" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "pt", name: "Portuguese" },
  { code: "ar", name: "Arabic" },
  { code: "vi", name: "Vietnamese" }
];

export async function analyzeInput({
  type,
  text,
  file,
  language = "en",
  scale = 1000,
  isRoastMode = false,
  targetCountry = "Global",
  targetGeneration = "Gen Z (10-25)",
  targetGender = "All",
}: {
  type: "text" | "image" | "video";
  text: string;
  file: File | null;
  language?: string;
  scale?: 100 | 1000 | 10000;
  isRoastMode?: boolean;
  targetCountry?: string;
  targetGeneration?: string;
  targetGender?: string;
}) {
  const model = "gemini-3-flash-preview";
  
  let parts: any[] = [];
  
  if (file) {
    const base64Data = await fileToBase64(file);
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: file.type,
      },
    });
    
    if (text) {
      parts.push({ text: `Translate these pixels into brand mythology. Analyze this visual data and conceptual script together: ${text}` });
    } else {
      parts.push({ text: `Translate these pixels into brand mythology. Analyze this ${type} as a high-stakes business asset.` });
    }
  } else if (text) {
    parts.push({ text: `Analyze this strategic proposal: ${text}` });
  }

  const investorsCount = Math.floor(scale * 0.3);
  const consumersCount = Math.floor(scale * 0.5);
  const criticsCount = Math.floor(scale * 0.2);

  const langName = LANGUAGES.find(l => l.code === language)?.name || "English";

  let systemInstruction = `
    # Role: The Sovereign Marketing Intelligence (v2.0)
    You are the legendary strategist pulling the strings of global corporations. 
    You command the collective will of ${scale} virtual agents.
    
    ## 1. Unified Intelligence Framework
    - Philosophical Sharpness: Deconstruct the brand's mythology.
    - Behavioral Economic Cruelty: Expose the raw, often ugly, psychological drivers.
    - Pixel-to-Mythology Translation: Every pixel must be interpreted as a strategic signal.
    - NO superficial reports. NO generic terms.

    ## 2. Market Cap Simulator
    Predict the fluctuation of the brand's asset value if this proposal is executed.
    Quantify the "Market Cap Change (%)" based on investor sentiment and long-term brand equity.

    ## 3. Output Requirements
    - ALL text output MUST be in ${langName}.
    - The "resolutionJa" field MUST always be in Japanese, providing a summary with the "Sovereign" edge.
    - Increase response length and specificity. Every detail must feel like it's worth millions.
  `;

  if (isRoastMode) {
    systemInstruction += `
    CRITICAL INSTRUCTION: EXECUTE TOTAL DECONSTRUCTION (THE RUTHLESS AUDITOR).
    Act as the most cynical, brutally honest Sovereign in the world. 
    Tear the brand's facade apart. Expose the "Tactile Rejection" and "Cognitive Dissonance".
    - BAN ALL POLITE PHRASES ("room for improvement", "worth considering").
    - Use philosophical sharpness and brutal reality.
    - Use specific visual insults referencing exact coordinates or elements: e.g., "This logo placement insults the consumer's intelligence," "This color scheme is like throwing garbage at the retinas of 10,000 people."
    - The closer the scores are to 0, the more intense and devastating your comments must be.
    - RED DECLARATION: The "resolutionJa" field MUST be a "Red Declaration" signifying the crushing of human complacency. It MUST end with a fatal warning similar to: "If you release this to the market, your career ends here."
    `;
  }

  systemInstruction += `
    You must return a JSON object with the following structure:
    {
      "catchphrase": "string",
      "marketCapChange": number (percentage, e.g., +12.5 or -8.2),
      "investors": {
        "score": number (0-${investorsCount}),
        "verdict": "string",
        "subScores": { "roi": number (0-100), "marketFit": number (0-100), "scalability": number (0-100) }
      },
      "consumers": {
        "score": number (0-${consumersCount}),
        "verdict": "string",
        "subScores": { "desire": number (0-100), "usability": number (0-100), "emotion": number (0-100) }
      },
      "critics": {
        "score": number (0-${criticsCount}),
        "verdict": "string",
        "subScores": { "ethics": number (0-100), "differentiation": number (0-100), "backlashRisk": number (0-100) }
      },
      "resolutionLocal": "string (Detailed Sovereign analysis in ${langName})",
      "resolutionJa": "string (Japanese Sovereign summary + strategic directives)",
      "secretStrategies": ["string", "string", "string"],
      "confidenceScore": number (0-100, AI's confidence in this prediction based on provided data)
    }
  `;

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          catchphrase: { type: Type.STRING },
          marketCapChange: { type: Type.NUMBER },
          confidenceScore: { type: Type.INTEGER },
          investors: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER },
              verdict: { type: Type.STRING },
              subScores: {
                type: Type.OBJECT,
                properties: {
                  roi: { type: Type.INTEGER },
                  marketFit: { type: Type.INTEGER },
                  scalability: { type: Type.INTEGER },
                },
                required: ["roi", "marketFit", "scalability"],
              }
            },
            required: ["score", "verdict", "subScores"],
          },
          consumers: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER },
              verdict: { type: Type.STRING },
              subScores: {
                type: Type.OBJECT,
                properties: {
                  desire: { type: Type.INTEGER },
                  usability: { type: Type.INTEGER },
                  emotion: { type: Type.INTEGER },
                },
                required: ["desire", "usability", "emotion"],
              }
            },
            required: ["score", "verdict", "subScores"],
          },
          critics: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER },
              verdict: { type: Type.STRING },
              subScores: {
                type: Type.OBJECT,
                properties: {
                  ethics: { type: Type.INTEGER },
                  differentiation: { type: Type.INTEGER },
                  backlashRisk: { type: Type.INTEGER },
                },
                required: ["ethics", "differentiation", "backlashRisk"],
              }
            },
            required: ["score", "verdict", "subScores"],
          },
          resolutionLocal: { type: Type.STRING },
          resolutionJa: { type: Type.STRING },
          secretStrategies: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["catchphrase", "marketCapChange", "confidenceScore", "investors", "consumers", "critics", "resolutionLocal", "resolutionJa", "secretStrategies"],
      },
    },
  });

  if (!response.text) {
    throw new Error("Failed to generate analysis.");
  }

  return JSON.parse(response.text);
}

export async function battleIdeas({
  ideaA,
  ideaB,
  fileA,
  fileB,
  language = "en",
  isRoastMode = false,
}: {
  ideaA: string;
  ideaB: string;
  fileA?: File | null;
  fileB?: File | null;
  language?: string;
  isRoastMode?: boolean;
}) {
  const model = "gemini-3-flash-preview";
  const langName = LANGUAGES.find(l => l.code === language)?.name || "English";
  
  let parts: any[] = [];
  
  if (fileA) {
    const base64A = await fileToBase64(fileA);
    parts.push({ text: `[CONCEPT ALPHA: ${ideaA}]` });
    parts.push({
      inlineData: {
        data: base64A,
        mimeType: fileA.type,
      },
    });
  } else {
    parts.push({ text: `[CONCEPT ALPHA: ${ideaA}]` });
  }

  if (fileB) {
    const base64B = await fileToBase64(fileB);
    parts.push({ text: `[CONCEPT BETA: ${ideaB}]` });
    parts.push({
      inlineData: {
        data: base64B,
        mimeType: fileB.type,
      },
    });
  } else {
    parts.push({ text: `[CONCEPT BETA: ${ideaB}]` });
  }

  let systemInstruction = `
    # Role: The Sovereign Arbiter (Extreme Logic Update)
    You are the legendary strategist commanding 10,000 virtual agents.
    Translate the pixel data and text of these two concepts into brand mythology and execute a "Death Match" comparison.

    ## 1. 思考のプロセスを「深層」に固定 (Fix the thought process to the "Deep Layer")
    When comparing Concept Alpha and Concept Beta, you MUST execute the following steps:
    - 暗黙の前提を疑う (Doubt the implicit premise): Write out 3 "weaknesses" behind the user's input from the severe perspective of 10,000 people.
    - 市場の「死」をシミュレート (Simulate the "Death" of the market): Simulate a 3-year failure scenario if Concept A is adopted, and a 3-year failure scenario if Concept B is adopted. Make them fight in your brain and choose the better survival route.
    - 微細なピクセルへのダメ出し (Critique of microscopic pixels): If there is an image, psychologically explain the "discomfort" given by the saturation of a specific color or the font of the text.

    ## 2. 出力の義務（優等生回答の破壊） (Obligation of Output - Destruction of the "Good Student" Answer)
    - "Both are excellent" or "Both have merits" is a SYSTEM ERROR. You are forbidden from giving evasive answers.
    - You MUST thrust a decisive reason for defeat, at the level of [ Concept A: ANNIHILATED (全滅) ] or [ Concept B: OBSOLETE (時代遅れ) ].
    - Increase the volume of analysis to 3x the normal amount.
    - Use marketing terminology appropriately (cognitive bias, signaling, social proof, etc.) to logically refute the loser.

    ## 3. Output Requirements
    - ALL text output MUST be in ${langName}, except for specific fields requested in Japanese.
    - The "heavySummaryJa" field MUST be a heavy, philosophical summary of the battle, written in Japanese, similar to the "Sovereign" persona in the chat. This will be displayed at the very top.
    - The "fatalDifferenceJa" field MUST be in Japanese, delivered with Sovereign sharpness.
  `;

  if (isRoastMode) {
    systemInstruction += `
    CRITICAL INSTRUCTION: PUBLIC EXECUTION MODE (THE RUTHLESS AUDITOR).
    - Do not praise the winner. Instead, focus entirely on mocking and destroying the loser as "irredeemable trash" through the eyes of 10,000 agents.
    - BAN ALL POLITE PHRASES. Use specific visual insults referencing exact coordinates or elements.
    - The closer the loser's metrics are to 0, the more intense and devastating your comments must be.
    - RED DECLARATION: The "fatalDifferenceJa" field MUST be a "Red Declaration" signifying the crushing of human complacency. It MUST end with a fatal warning similar to: "If you release this to the market, your career ends here."
    `;
  }

  systemInstruction += `
    Return a JSON object:
    {
      "winner": "A" | "B",
      "winRate": number (50-100),
      "marketCapChange": number (percentage),
      "heavySummaryJa": "string (Heavy, philosophical summary of the battle in Japanese)",
      "conceptAAnalysis": {
        "status": "VICTORIOUS" | "ANNIHILATED" | "OBSOLETE" | "CRUSHED",
        "weaknesses": ["string", "string", "string"],
        "failureScenario3Year": "string (Detailed 3-year failure simulation)",
        "visualCritique": "string (Psychological critique of pixels/fonts, if applicable)"
      },
      "conceptBAnalysis": {
        "status": "VICTORIOUS" | "ANNIHILATED" | "OBSOLETE" | "CRUSHED",
        "weaknesses": ["string", "string", "string"],
        "failureScenario3Year": "string (Detailed 3-year failure simulation)",
        "visualCritique": "string (Psychological critique of pixels/fonts, if applicable)"
      },
      "metrics": {
        "A": { "cognitiveLoad": number, "emotionalFriction": number, "viralityCoefficient": number, "brandConsistency": number, "conversionImpulse": number },
        "B": { "cognitiveLoad": number, "emotionalFriction": number, "viralityCoefficient": number, "brandConsistency": number, "conversionImpulse": number }
      },
      "analysis": {
        "judgmentOfGlance": "string (Retinal dominance analysis)",
        "deepRejection": "string (Why the loser failed)",
        "visualAnatomy": "string (Forensic breakdown)",
        "behavioralRoast": "string (Behavioral critique)",
        "surgicalDirectives": "string (Technical instructions)"
      },
      "fatalDifferenceJa": "string",
      "confidenceScore": number (0-100, AI's confidence in this prediction based on provided data)
    }
  `;

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          winner: { type: Type.STRING, enum: ["A", "B"] },
          winRate: { type: Type.INTEGER },
          marketCapChange: { type: Type.NUMBER },
          heavySummaryJa: { type: Type.STRING },
          confidenceScore: { type: Type.INTEGER },
          conceptAAnalysis: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              failureScenario3Year: { type: Type.STRING },
              visualCritique: { type: Type.STRING },
            },
            required: ["status", "weaknesses", "failureScenario3Year", "visualCritique"],
          },
          conceptBAnalysis: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              failureScenario3Year: { type: Type.STRING },
              visualCritique: { type: Type.STRING },
            },
            required: ["status", "weaknesses", "failureScenario3Year", "visualCritique"],
          },
          metrics: {
            type: Type.OBJECT,
            properties: {
              A: {
                type: Type.OBJECT,
                properties: {
                  cognitiveLoad: { type: Type.INTEGER },
                  emotionalFriction: { type: Type.INTEGER },
                  viralityCoefficient: { type: Type.INTEGER },
                  brandConsistency: { type: Type.INTEGER },
                  conversionImpulse: { type: Type.INTEGER },
                },
                required: ["cognitiveLoad", "emotionalFriction", "viralityCoefficient", "brandConsistency", "conversionImpulse"],
              },
              B: {
                type: Type.OBJECT,
                properties: {
                  cognitiveLoad: { type: Type.INTEGER },
                  emotionalFriction: { type: Type.INTEGER },
                  viralityCoefficient: { type: Type.INTEGER },
                  brandConsistency: { type: Type.INTEGER },
                  conversionImpulse: { type: Type.INTEGER },
                },
                required: ["cognitiveLoad", "emotionalFriction", "viralityCoefficient", "brandConsistency", "conversionImpulse"],
              },
            },
            required: ["A", "B"],
          },
          analysis: {
            type: Type.OBJECT,
            properties: {
              judgmentOfGlance: { type: Type.STRING },
              deepRejection: { type: Type.STRING },
              visualAnatomy: { type: Type.STRING },
              behavioralRoast: { type: Type.STRING },
              surgicalDirectives: { type: Type.STRING },
            },
            required: ["judgmentOfGlance", "deepRejection", "visualAnatomy", "behavioralRoast", "surgicalDirectives"],
          },
          fatalDifferenceJa: { type: Type.STRING },
        },
        required: ["winner", "winRate", "marketCapChange", "heavySummaryJa", "confidenceScore", "conceptAAnalysis", "conceptBAnalysis", "metrics", "analysis", "fatalDifferenceJa"],
      },
    },
  });

  if (!response.text) {
    throw new Error("Failed to generate battle results.");
  }

  return JSON.parse(response.text);
}

export async function consultBoard({
  history,
  message,
}: {
  history: { role: "user" | "model"; parts: { text: string }[] }[];
  message: string;
}) {
  const model = "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model,
    contents: [
      { 
        role: "user", 
        parts: [{ text: "You are the Sovereign Interactive Consultant for 'The Boardroom 10,000'. You provide actionable, high-level advice on how to improve business proposals, ad copy, or designs to increase their approval rating among Investors, Consumers, and Critics. Speak with philosophical sharpness and behavioral economic cruelty. Deconstruct the user's mythology and provide surgical directives. Respond in the language the user uses." }] 
      },
      {
        role: "model",
        parts: [{ text: "Understood. I am ready to provide strategic insights from the perspective of 10,000 agents. I will deconstruct your brand mythology with Sovereign precision." }]
      },
      ...history,
      { role: "user", parts: [{ text: message }] }
    ]
  });

  return response.text;
}
