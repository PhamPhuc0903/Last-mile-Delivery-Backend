import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export const generateChatbotAnswer = async ({ question, orderContext, history }) => {
    if (!process.env.OPENAI_API_KEY) {
        return {
            provider: "fallback",
            answer:
                "Hiện tại chatbot AI chưa được cấu hình OPENAI_API_KEY. Tôi có thể hỗ trợ cơ bản: vui lòng kiểm tra mã đơn hàng trong mục đơn hàng của bạn hoặc liên hệ hỗ trợ nếu đơn bị chậm."
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