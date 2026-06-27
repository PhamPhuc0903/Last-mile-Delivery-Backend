import OpenAI from "openai";

const getOpenAIClient = () => {
    const apiKey = (process.env.OPENAI_API_KEY || "").trim();

    if (!apiKey) {
        return null;
    }

    return new OpenAI({
        apiKey
    });
};

export const analyzeOrderRiskWithLLM = async (input, ruleBasedResult) => {
    const client = getOpenAIClient();

    if (!client) {
        return {
            provider: "fallback",
            enabled: false,
            summary:
                "LLM analysis is disabled because OPENAI_API_KEY is not configured.",
            recommendation:
                "Use the rule-based risk score result for this request."
        };
    }

    try {
        const response = await client.responses.create({
            model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
            input: [
                {
                    role: "system",
                    content:
                        "You are an AI assistant for a last-mile delivery system. Analyze delivery risk based only on the given data. Return concise JSON-like explanation."
                },
                {
                    role: "user",
                    content: JSON.stringify({
                        input,
                        ruleBasedResult
                    })
                }
            ]
        });

        return {
            provider: "openai",
            enabled: true,
            summary: response.output_text
        };
    } catch (error) {
        return {
            provider: "fallback",
            enabled: false,
            summary: "LLM analysis failed. Falling back to rule-based result.",
            error: error.message
        };
    }
};