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

export const generateChatbotAnswer = async ({
                                                question,
                                                orderContext,
                                                history
                                            }) => {
    const client = getOpenAIClient();

    if (!client) {
        return {
            provider: "fallback",
            answer:
                "Hiện tại chatbot AI chưa được cấu hình OPENAI_API_KEY. Tôi có thể hỗ trợ cơ bản: vui lòng kiểm tra trạng thái đơn hàng trong hệ thống hoặc liên hệ hỗ trợ nếu đơn bị chậm."
        };
    }

    const response = await client.responses.create({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: [
            {
                role: "system",
                content:
                    "Bạn là chatbot hỗ trợ khách hàng cho nền tảng giao hàng chặng cuối. Trả lời ngắn gọn, lịch sự, bằng tiếng Việt. Nếu có dữ liệu đơn hàng, hãy dựa trên dữ liệu đó. Không bịa thông tin không có trong context."
            },
            {
                role: "user",
                content: JSON.stringify({
                    question,
                    orderContext,
                    recentMessages: history
                })
            }
        ]
    });

    return {
        provider: "openai",
        answer: response.output_text
    };
};