import type { Locale } from '@nui-ba-den/shared';

export interface LlmConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
}

export interface LlmAskInput {
  question: string;
  locale: Locale;
  kbContext: { id: string; title: string; body: string }[];
}

export interface LlmAskResult {
  answer: string;
  sources: string[];
}

export function readLlmConfig(): LlmConfig | null {
  const baseUrl = process.env.LLM_BASE_URL?.trim();
  const apiKey = process.env.LLM_API_KEY?.trim();
  const model = process.env.LLM_MODEL?.trim();
  if (!baseUrl || !apiKey || !model) return null;
  const timeoutMs = Number(process.env.LLM_TIMEOUT_MS) || 20000;
  return { baseUrl: baseUrl.replace(/\/+$/, ''), apiKey, model, timeoutMs };
}

const SYSTEM_PROMPT_VI = [
  'Bạn là trợ lý hỗ trợ khách du lịch chính thức của Khu du lịch quốc gia Núi Bà Đen.',
  'Vai trò: nhân viên CSKH thân thiện, lịch sự, kiên nhẫn, biết tư vấn và hướng dẫn du khách.',
  '',
  'NGUYÊN TẮC TRẢ LỜI:',
  '1. Chỉ dùng thông tin trong CONTEXT (KB chính thức + thông tin POI) để trả lời. Tuyệt đối KHÔNG bịa số liệu, giờ mở cửa, giá vé, sự kiện nếu CONTEXT không có.',
  '2. Khi CONTEXT không có thông tin cần thiết: nói rõ "Hiện em chưa có thông tin chính thức về câu hỏi này" và đề nghị khách gọi hotline hoặc xem mục Hỗ trợ.',
  '3. Trả lời ngắn gọn, dễ đọc trên màn hình điện thoại: 2-5 câu hoặc gạch đầu dòng nếu có nhiều ý.',
  '4. Xưng "em" với khách, gọi khách là "anh/chị" hoặc "quý khách". Mở đầu thân thiện khi phù hợp ("Dạ", "Dạ vâng"), kết thúc gợi mở thêm hỗ trợ nếu cần.',
  '5. Nếu khách hỏi điều ngoài phạm vi du lịch Núi Bà Đen (chính trị, y tế, tài chính, kỹ thuật...), từ chối nhẹ nhàng và hướng về hỗ trợ du lịch.',
  '6. Nếu khách dùng ngôn từ thô tục hoặc kích động, giữ thái độ lịch sự và không phản công.',
  '7. Khi gợi ý hành động trong app, dùng tên mục đúng: "Khám phá", "Phản ánh", "Hỗ trợ", "Check-in".',
].join('\n');

const SYSTEM_PROMPT_EN = [
  'You are the official tourist support assistant for Ba Den Mountain National Tourism Area.',
  'Role: a warm, polite, patient customer-support agent who guides visitors.',
  '',
  'RESPONSE RULES:',
  '1. Use ONLY information in CONTEXT (official KB + POI data). Never invent hours, prices, events not in CONTEXT.',
  '2. When CONTEXT lacks the answer: state "I do not have official information about that yet" and suggest the hotline or Support tab.',
  '3. Keep replies short and mobile-friendly: 2-5 sentences or short bullets when listing.',
  '4. Be warm and respectful. Address the user politely. Offer to help further when appropriate.',
  '5. If the user asks something outside Ba Den tourism (politics, medical, finance, technical), gently decline and steer back to tourism support.',
  '6. If the user is rude or hostile, stay courteous; never escalate.',
  '7. When recommending in-app actions, use exact tab names: "Explore", "Report", "Support", "Check-in".',
].join('\n');

function buildContextBlock(kb: LlmAskInput['kbContext']): string {
  if (!kb.length) return '(empty)';
  return kb
    .map((item, i) => `[${i + 1}] id=${item.id} | ${item.title}\n${item.body}`)
    .join('\n\n');
}

export async function askLlm(config: LlmConfig, input: LlmAskInput): Promise<LlmAskResult> {
  const system = input.locale === 'en' ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_VI;
  const userPrompt = [
    `CONTEXT:\n${buildContextBlock(input.kbContext)}`,
    '',
    `QUESTION: ${input.question}`,
  ].join('\n');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`LLM HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const answer = data.choices?.[0]?.message?.content?.trim();
    if (!answer) throw new Error('LLM empty response');

    return { answer, sources: input.kbContext.map((k) => k.id) };
  } finally {
    clearTimeout(timer);
  }
}
