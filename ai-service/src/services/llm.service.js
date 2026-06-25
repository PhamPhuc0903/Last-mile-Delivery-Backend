import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export const analyzeOrderRiskWithLLM = async (orderData, ruleBasedResult) => {
    if (!process.env.OPENAI_API_KEY) {
        return {
            provider: "fallback",
            riskLevel: ruleBasedResult.riskLevel || "UNKNOWN",
            explanation:
                "OPENAI_API_KEY is not configured. The system used rule-based analysis only.",
            recommendedAction: "Review this order manually if the risk score is high."
        };
    }

    const response = await client.responses.create({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: [
            {
                role: "system",
                content:
                    "You are an AI assistant for a last-mile delivery platform. Analyze delivery order risk. Return valid JSON only."
            },
            {
                role: "user",
                content: JSON.stringify({
                    orderData,
                    ruleBasedResult,
                    requiredJsonOutput: {
                        riskLevel: "LOW | MEDIUM | HIGH",
                        explanation: "short explanation in Vietnamese",
                        recommendedAction: "recommended action for operator"
                    }
                })
            }
        ]
    });

    try {
        return {
            provider: "openai",
            ...JSON.parse(response.output_text)
        };
    } catch (error) {
        return {
            provider: "openai",
            riskLevel: ruleBasedResult.riskLevel || "UNKNOWN",
            explanation: response.output_text,
            recommendedAction: "Review the AI explanation manually."
        };
    }
};