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

export async function analyzeInput({
  type,
  text,
  file,
  language,
  scale = 1000,
  isRoastMode = false,
  targetCountry = "Global",
  targetGeneration = "Gen Z (10-25)",
  targetGender = "All",
}: {
  type: "text" | "image" | "video";
  text: string;
  file: File | null;
  language: string;
  scale?: 100 | 1000 | 10000;
  isRoastMode?: boolean;
  targetCountry?: string;
  targetGeneration?: string;
  targetGender?: string;
}) {
  const model = "gemini-3-flash-preview";
  
  let parts: any[] = [];
  
  if (type === "text") {
    parts.push({ text: `Analyze this business proposal/idea: ${text}` });
  } else if (file) {
    const base64Data = await fileToBase64(file);
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: file.type,
      },
    });
    if (text) {
      parts.push({ text: `Analyze this ${type} along with this context: ${text}` });
    } else {
      parts.push({ text: `Analyze this ${type} as a business proposal or ad.` });
    }
  }

  const investorsCount = Math.floor(scale * 0.3);
  const consumersCount = Math.floor(scale * 0.5);
  const criticsCount = Math.floor(scale * 0.2);

  let systemInstruction = `
    You are the central intelligence of 'The Boardroom ${scale}', a virtual board of directors consisting of ${scale} agents:
    - ${investorsCount} Investors: Focus on ROI, market size, financial viability, and risk.
    - ${consumersCount} Consumers: Focus on desire, emotional connection, intuitive appeal, and usability.
    - ${criticsCount} Critics: Focus on ethics, brand safety, differentiation, and potential backlash.

    Target Audience Persona:
    - Country/Region: ${targetCountry}
    - Generation: ${targetGeneration}
    - Gender: ${targetGender}

    You must evaluate the user's input and simulate the voting of these ${scale} agents, specifically tailoring your analysis to the Target Audience Persona defined above. For example, if the target is Dubai's Gen Z, act as ${scale} agents who are discerning with the latest tech and luxury brands in the UAE. Consider cultural nuances, values, and specific preferences of this demographic.
    
    CRITICAL INSTRUCTION REGARDING LANGUAGE:
    ALL text output (catchphrase, verdicts, resolutionLocal, secretStrategies, etc.) MUST be written in the language corresponding to the code: "${language}". 
    (e.g., if "ja", write in Japanese. If "en", write in English. If "zh", write in Chinese).
    The ONLY exception is "resolutionJa" which MUST always be in Japanese.
  `;

  if (isRoastMode) {
    systemInstruction += `
    CRITICAL INSTRUCTION: ROAST MODE IS ENABLED.
    あなたは一切の妥協を許さない、世界で最も口の悪い批評家になりきってください。ユーモアを交えつつ、ユーザーの企画を木っ端微塵に粉砕せよ。
    - Amplify the Critics' personality to 200%.
    - Be brutally honest, highly critical, and use dark humor.
    - Tear the idea apart if it deserves it. Do not hold back.
    - Provide a "spicy and toxic catchphrase" (catchphrase) that is highly shareable on SNS, summarizing the roast.
    `;
  } else {
    systemInstruction += `
    Maintain a balanced, objective, and constructive tone.
    Provide actionable feedback without being overly harsh.
    - Provide a professional, objective, and insightful "catchphrase" summarizing the core value or main critique.
    `;
  }

  systemInstruction += `
    You must return a JSON object with the following structure:
    {
      "catchphrase": "string (A short, punchy summary or roast)",
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
      "resolutionLocal": "string (A comprehensive summary of the board's decision in the target language ${language})",
      "resolutionJa": "string (A Japanese translation of the resolutionLocal, plus developer notes/advice)",
      "secretStrategies": ["string", "string", "string"] (3 specific, clever, slightly 'sneaky' strategies to win in this specific market)
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
        required: ["catchphrase", "investors", "consumers", "critics", "resolutionLocal", "resolutionJa", "secretStrategies"],
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
  language,
}: {
  ideaA: string;
  ideaB: string;
  language: string;
}) {
  const model = "gemini-3.1-pro-preview";
  
  const systemInstruction = `
    You are the central intelligence of 'The Boardroom 1000'.
    You must compare Idea A and Idea B, and simulate the voting of 1,000 agents to determine the winner.
    
    CRITICAL INSTRUCTION REGARDING LANGUAGE:
    ALL text output (fatalDifferenceLocal) MUST be written in the language corresponding to the code: "${language}".
    (e.g., if "ja", write in Japanese. If "en", write in English).
    The ONLY exception is "fatalDifferenceJa" which MUST always be in Japanese.
    
    Return a JSON object:
    {
      "winner": "A" | "B",
      "winRate": number (50-100),
      "fatalDifferenceLocal": "string (Explanation of the decisive factor in the target language ${language})",
      "fatalDifferenceJa": "string (Japanese translation and developer notes)"
    }
  `;

  const response = await ai.models.generateContent({
    model,
    contents: `Idea A: ${ideaA}\n\nIdea B: ${ideaB}`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          winner: { type: Type.STRING, enum: ["A", "B"] },
          winRate: { type: Type.INTEGER },
          fatalDifferenceLocal: { type: Type.STRING },
          fatalDifferenceJa: { type: Type.STRING },
        },
        required: ["winner", "winRate", "fatalDifferenceLocal", "fatalDifferenceJa"],
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
  const formattedHistory = history.map(h => `${h.role === 'user' ? 'User' : 'Consultant'}: ${h.parts[0].text}`).join('\n');
  const prompt = `Previous conversation:\n${formattedHistory}\n\nUser: ${message}\n\nConsultant:`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      systemInstruction: "You are the Interactive Consultant for 'The Boardroom 1000'. You provide actionable, high-level advice on how to improve business proposals, ad copy, or designs to increase their approval rating among Investors, Consumers, and Critics. Speak in a professional, slightly detached, yet insightful tone. Always respond in Japanese.",
    }
  });

  return response.text;
}
