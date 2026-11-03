import type { KeyExpression } from "@/shared/expressions";

/**
 * Key expressions to learn before each mission, written for this app (not
 * taken from any book). Each is a reusable frame rather than one sentence,
 * so the learner can fill it with their own words. Keyed by mission slug.
 */
export const KEY_EXPRESSIONS: Record<string, KeyExpression[]> = {
  "cafe-order": [
    { en: "Could I get ~?", ko: "~ 주시겠어요? 주문할 때 가장 무난한 말", example: "Could I get an iced latte?" },
    { en: "Can I get that with ~?", ko: "그걸 ~로 해 주실 수 있어요? 옵션 바꿀 때", example: "Can I get that with oat milk?" },
    { en: "Could you make it ~?", ko: "~하게 만들어 주실래요? 연하게, 덜 달게 등", example: "Could you make it less sweet?" },
    { en: "for here / to go", ko: "매장에서 먹을게요 / 가져갈게요", example: "To go, please." },
    { en: "That's all, thanks", ko: "그게 다예요. 주문을 마칠 때", example: "That's all, thanks." },
  ],
  "subway-directions": [
    { en: "How do I get to ~?", ko: "~까지 어떻게 가요?", example: "How do I get to the City Museum?" },
    { en: "Which line ~?", ko: "몇 호선(어느 노선)을 ~?", example: "Which line goes to the museum?" },
    { en: "Do I have to transfer / Do I need to transfer", ko: "갈아타야 하나요?", example: "Do I have to transfer anywhere?" },
    { en: "get off at ~", ko: "~에서 내리다", example: "Should I get off at Central Station?" },
    { en: "Just to make sure / So you mean", ko: "확인하자면 / 그러니까 ~라는 거죠? 들은 내용 확인할 때", example: "Just to make sure, I take the green line?" },
  ],
  "clothes-exchange": [
    { en: "I bought ~ but", ko: "~를 샀는데요. 문제를 꺼낼 때", example: "I bought this shirt here, but it doesn't fit." },
    { en: "It's a little too ~", ko: "조금 너무 ~해요", example: "It's a little too tight around the shoulders." },
    { en: "Could I exchange it for ~?", ko: "~로 교환할 수 있을까요?", example: "Could I exchange it for a large?" },
    { en: "Do you have this in ~?", ko: "이거 ~로 있어요? 사이즈나 색", example: "Do you have this in navy?" },
    { en: "I'd rather ~", ko: "차라리 ~할게요. 대안 고를 때", example: "I'd rather get a refund, then." },
  ],
  "restaurant-allergy": [
    { en: "I'm allergic to ~", ko: "~ 알레르기가 있어요", example: "I'm allergic to nuts." },
    { en: "Does this have any ~ in it? / Does it contain", ko: "여기 ~ 들어가요?", example: "Does this have any peanuts in it?" },
    { en: "Could you make it without ~?", ko: "~ 빼고 해 주실 수 있어요?", example: "Could you make it without the sauce?" },
    { en: "What would you recommend", ko: "뭘 추천하세요?", example: "What would you recommend for me?" },
    { en: "I'll go with ~", ko: "~로 할게요. 결정할 때", example: "I'll go with the grilled chicken." },
  ],
  "work-introduction": [
    { en: "I just joined ~ / I just started", ko: "막 ~에 합류했어요", example: "I just joined the design team." },
    { en: "I'll be working on ~", ko: "~를 맡게 될 거예요", example: "I'll be working on the mobile app." },
    { en: "Before this, I ~", ko: "이전에는 ~했어요", example: "Before this, I worked in marketing for three years." },
    { en: "I'm mainly in charge of ~ / I'm responsible for", ko: "주로 ~를 담당해요", example: "I'm mainly in charge of user research." },
    { en: "How long have you been ~?", ko: "~한 지 얼마나 됐어요? 되묻기", example: "How long have you been on this team?" },
  ],
  "meeting-reschedule": [
    { en: "I'm calling about ~", ko: "~ 건으로 전화드렸어요. 용건 꺼낼 때", example: "I'm calling about tomorrow's meeting." },
    { en: "Something came up / Something has come up", ko: "일이 좀 생겼어요", example: "Sorry, something came up this morning." },
    { en: "I was wondering if ~", ko: "혹시 ~할 수 있을까 해서요. 정중한 부탁", example: "I was wondering if we could move it to Thursday." },
    { en: "Would ~ work for you?", ko: "~ 괜찮으세요? 시간 제안", example: "Would 3 p.m. work for you?" },
    { en: "Sorry for the short notice", ko: "갑자기 말씀드려 죄송해요", example: "Sorry for the short notice." },
  ],
  "clinic-appointment": [
    { en: "I'd like to make an appointment", ko: "진료 예약을 하고 싶어요", example: "I'd like to make an appointment for today." },
    { en: "I've had ~ for", ko: "~한 지 (기간)째예요. 증상 말할 때", example: "I've had a fever for two days." },
    { en: "It hurts when ~", ko: "~할 때 아파요", example: "It hurts when I swallow." },
    { en: "Do you have anything ~?", ko: "~에 비는 시간 있어요?", example: "Do you have anything this afternoon?" },
    { en: "That works for me", ko: "그 시간 좋아요. 시간 확정할 때", example: "Four o'clock? That works for me." },
  ],
  "neighbor-noise": [
    { en: "Sorry to bother you", ko: "귀찮게 해서 미안해요. 말 꺼낼 때", example: "Sorry to bother you, do you have a minute?" },
    { en: "I wanted to mention ~ / I wanted to talk to you about", ko: "~에 대해 말씀드리고 싶었어요", example: "I wanted to mention something about the noise." },
    { en: "I've been hearing ~", ko: "요즘 ~가 들려요. 구체적으로 설명", example: "I've been hearing music around midnight." },
    { en: "Would you mind ~ing?", ko: "~해 주실 수 있을까요? 부드러운 부탁", example: "Would you mind keeping it down after eleven?" },
    { en: "Thanks for understanding", ko: "이해해 줘서 고마워요", example: "Thanks for understanding." },
  ],
};

export function keyExpressionsFor(slug: string): KeyExpression[] {
  return KEY_EXPRESSIONS[slug] ?? [];
}
