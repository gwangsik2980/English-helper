import type { Category, Scenario, SuccessCriterion } from "@/shared/schemas/domain";

/**
 * Seed catalog. Written as drafts for the MVP; content editors should review
 * wording before launch. mockPatterns/mockScript are used only in demo mode.
 */
export type MissionSeed = {
  id: string;
  slug: string;
  title: string;
  category: Category;
  levelMin: number;
  levelMax: number;
  durationMin: number;
  version: number;
  scenario: Scenario;
  successCriteria: SuccessCriterion[];
};

export const MISSION_SEEDS: MissionSeed[] = [
  {
    id: "m-cafe-order",
    slug: "cafe-order",
    title: "카페에서 음료 주문하기",
    category: "dining",
    levelMin: 1,
    levelMax: 2,
    durationMin: 5,
    version: 1,
    scenario: {
      summaryKo: "음료를 주문하고 우유를 바꿔 달라고 요청해요.",
      backgroundKo:
        "출근길에 들른 동네 카페예요. 평소 마시는 라테를 주문하는데, 오늘은 일반 우유 대신 오트 밀크로 바꾸고 싶어요. 바리스타가 사이즈와 매장 이용 여부를 물어볼 거예요.",
      aiRole: "a friendly barista at a neighborhood cafe",
      userRole: "a customer ordering a drink on the way to work",
      setting: "A small, busy cafe in the morning.",
      openingLine: "Hi there! What can I get started for you today?",
      learningPointsKo: ["정중하게 주문하기", "옵션 변경 요청하기", "확인 질문에 답하기"],
      hintPhrases: [
        "Could I have a latte, please?",
        "Can I get that with oat milk?",
        "A medium, please.",
        "For here, please. / To go, please.",
      ],
      mockScript: [
        "Sure! What size would you like? We have small, medium, and large.",
        "Got it. Would you like any changes, like a different kind of milk?",
        "No problem. Is that for here or to go?",
        "Perfect. That'll be five fifty. Can I get a name for the order?",
      ],
      mockClosing: "Thanks! Your drink will be ready at the end of the counter. Have a great day!",
      goalsAffinity: ["daily", "travel"],
    },
    successCriteria: [
      {
        id: "order_item",
        descriptionKo: "원하는 음료를 주문한다",
        mockPatterns: ["latte", "coffee", "americano", "tea", "cappuccino", "mocha", "drink"],
      },
      {
        id: "request_option",
        descriptionKo: "우유나 옵션 변경을 요청한다",
        mockPatterns: ["oat", "soy", "almond", "milk", "without", "extra", "less", "no ice", "decaf"],
      },
      {
        id: "answer_confirmation",
        descriptionKo: "사이즈나 매장 이용 여부 같은 확인 질문에 답한다",
        mockPatterns: ["small", "medium", "large", "for here", "to go", "take out", "takeout"],
      },
    ],
  },
  {
    id: "m-subway-directions",
    slug: "subway-directions",
    title: "지하철역에서 길 묻기",
    category: "transport",
    levelMin: 1,
    levelMax: 2,
    durationMin: 6,
    version: 1,
    scenario: {
      summaryKo: "처음 가는 도시에서 목적지까지 가는 노선을 물어봐요.",
      backgroundKo:
        "여행 중 낯선 도시의 지하철역에 있어요. 시립 박물관에 가야 하는데 어느 노선을 타야 할지 모르겠어요. 역무원에게 노선과 환승 여부, 걸리는 시간을 물어보세요.",
      aiRole: "a helpful station staff member",
      userRole: "a tourist who needs to get to the City Museum",
      setting: "A busy subway station information booth.",
      openingLine: "Hello! You look a little lost. Can I help you find something?",
      learningPointsKo: ["목적지 말하기", "노선과 환승 묻기", "들은 내용 확인하기"],
      hintPhrases: [
        "How do I get to the City Museum?",
        "Which line should I take?",
        "Do I need to transfer?",
        "How long does it take?",
        "So I take the green line and get off at...?",
      ],
      mockScript: [
        "Sure. You'll want the green line toward Riverside. Do you have a ticket already?",
        "Okay. You'll need to transfer once, at Central Station, to the blue line.",
        "It takes about twenty minutes in total. Get off at Museum Street.",
        "That's right. Exit three is the closest to the museum.",
      ],
      mockClosing: "You're all set. Enjoy the museum!",
      goalsAffinity: ["travel"],
    },
    successCriteria: [
      {
        id: "state_destination",
        descriptionKo: "가려는 목적지를 말한다",
        mockPatterns: ["museum", "get to", "go to", "looking for", "how do i get"],
      },
      {
        id: "ask_route",
        descriptionKo: "노선, 환승, 소요 시간 중 하나 이상을 묻는다",
        mockPatterns: ["which line", "transfer", "change", "how long", "how many stops", "line"],
      },
      {
        id: "confirm_understanding",
        descriptionKo: "들은 안내를 다시 말하거나 확인한다",
        mockPatterns: ["so i", "you mean", "just to confirm", "so,", "right?", "got it", "exit"],
      },
    ],
  },
  {
    id: "m-clothes-exchange",
    slug: "clothes-exchange",
    title: "옷 사이즈 교환하기",
    category: "shopping",
    levelMin: 1,
    levelMax: 3,
    durationMin: 7,
    version: 1,
    scenario: {
      summaryKo: "산 옷이 작아서 다른 사이즈로 바꿔 달라고 해요.",
      backgroundKo:
        "지난주에 산 셔츠가 입어 보니 작아요. 영수증을 가지고 매장에 다시 왔어요. 점원에게 상황을 설명하고 한 치수 큰 것으로 교환해 달라고 요청하세요.",
      aiRole: "a store clerk at a clothing shop",
      userRole: "a customer who wants to exchange a shirt",
      setting: "The customer service counter of a clothing store.",
      openingLine: "Hi, welcome back! How can I help you today?",
      learningPointsKo: ["문제 상황 설명하기", "교환 요청하기", "대안 받아들이거나 거절하기"],
      hintPhrases: [
        "I bought this shirt last week, but it's too small.",
        "Could I exchange it for a larger size?",
        "I have the receipt right here.",
        "Do you have it in a large?",
      ],
      mockScript: [
        "Oh, I'm sorry to hear that. Do you have the receipt with you?",
        "Thanks. What size would you like instead?",
        "Let me check... We don't have that color in a large, but we have it in navy. Would that work?",
        "Great. I'll get that exchanged for you right now.",
      ],
      mockClosing: "Here you go. If there's anything else, just let us know!",
      goalsAffinity: ["daily", "travel"],
    },
    successCriteria: [
      {
        id: "explain_problem",
        descriptionKo: "옷에 생긴 문제를 설명한다",
        mockPatterns: ["too small", "too big", "doesn't fit", "does not fit", "small", "tight"],
      },
      {
        id: "request_exchange",
        descriptionKo: "교환을 요청한다",
        mockPatterns: ["exchange", "swap", "change it", "larger", "bigger", "another size"],
      },
      {
        id: "respond_alternative",
        descriptionKo: "점원이 제안한 대안에 답한다",
        mockPatterns: ["navy", "that works", "that's fine", "okay", "sure", "no thanks", "refund"],
      },
    ],
  },
  {
    id: "m-restaurant-allergy",
    slug: "restaurant-allergy",
    title: "식당에서 알레르기 알리기",
    category: "dining",
    levelMin: 2,
    levelMax: 3,
    durationMin: 8,
    version: 1,
    scenario: {
      summaryKo: "견과류 알레르기를 알리고 안전한 메뉴를 추천받아요.",
      backgroundKo:
        "친구와 처음 가 보는 식당에 왔어요. 견과류 알레르기가 있어서 주문 전에 꼭 확인해야 해요. 종업원에게 알레르기를 알리고, 먹을 수 있는 메뉴를 물어본 뒤 주문하세요.",
      aiRole: "a server at a casual restaurant",
      userRole: "a diner with a nut allergy",
      setting: "A casual restaurant at dinner time.",
      openingLine: "Good evening! Are you ready to order, or do you need a few more minutes?",
      learningPointsKo: ["알레르기 정확히 알리기", "재료 확인 질문하기", "추천받아 주문하기"],
      hintPhrases: [
        "Before I order, I have a nut allergy.",
        "Does this dish contain any nuts?",
        "What would you recommend for someone with a nut allergy?",
        "I'll have the grilled chicken, then.",
      ],
      mockScript: [
        "Thanks for letting me know. That's important. Which dish were you thinking about?",
        "The pesto pasta does have pine nuts, so I'd avoid that one. The grilled chicken is nut-free.",
        "I'll let the kitchen know about your allergy. Anything to drink?",
        "Great choice. I'll put that in for you.",
      ],
      mockClosing: "Your order is in, and the kitchen knows about the allergy. Enjoy your meal!",
      goalsAffinity: ["travel", "daily"],
    },
    successCriteria: [
      {
        id: "state_allergy",
        descriptionKo: "알레르기가 있다고 알린다",
        mockPatterns: ["allerg", "nut", "peanut", "can't eat", "cannot eat"],
      },
      {
        id: "ask_ingredients",
        descriptionKo: "메뉴 재료나 추천을 묻는다",
        mockPatterns: ["contain", "does it have", "is there", "recommend", "safe", "ingredients"],
      },
      {
        id: "place_order",
        descriptionKo: "최종 메뉴를 주문한다",
        mockPatterns: ["i'll have", "i will have", "i'd like", "i would like", "chicken", "order"],
      },
    ],
  },
  {
    id: "m-work-introduction",
    slug: "work-introduction",
    title: "새 팀에 나를 소개하기",
    category: "work",
    levelMin: 1,
    levelMax: 3,
    durationMin: 6,
    version: 1,
    scenario: {
      summaryKo: "첫 출근 날 팀 동료에게 내 역할과 경력을 소개해요.",
      backgroundKo:
        "글로벌 팀에 새로 합류한 첫날이에요. 같은 팀 동료가 커피를 마시며 말을 걸어요. 이름과 맡은 일, 이전 경험을 소개하고 동료에게도 질문을 하나 해 보세요.",
      aiRole: "a friendly teammate on a global project team",
      userRole: "a new team member on their first day",
      setting: "The office kitchen during a coffee break.",
      openingLine: "Hey, you must be the new teammate! I'm Sam. Welcome aboard!",
      learningPointsKo: ["이름과 역할 소개하기", "이전 경험 짧게 말하기", "상대에게 되묻기"],
      hintPhrases: [
        "Nice to meet you, Sam. I'm ...",
        "I'll be working on ...",
        "Before this, I worked at ... for three years.",
        "How long have you been on the team?",
      ],
      mockScript: [
        "Nice to meet you! So what will you be working on here?",
        "That sounds interesting. What were you doing before you joined us?",
        "Cool. I think your experience will really help the team.",
        "Ha, about two years now. Let me know if you need anything!",
      ],
      mockClosing: "I've got a meeting, but let's grab lunch sometime this week. Welcome again!",
      goalsAffinity: ["work"],
    },
    successCriteria: [
      {
        id: "introduce_self",
        descriptionKo: "이름과 맡은 역할을 말한다",
        mockPatterns: ["i'm", "i am", "my name", "working on", "i'll be", "role", "engineer", "designer", "manager"],
      },
      {
        id: "share_background",
        descriptionKo: "이전 경험을 이야기한다",
        mockPatterns: ["before", "previously", "worked at", "worked for", "years", "used to"],
      },
      {
        id: "ask_back",
        descriptionKo: "동료에게 질문을 하나 한다",
        mockPatterns: ["how about you", "what about you", "how long", "?"],
      },
    ],
  },
  {
    id: "m-meeting-reschedule",
    slug: "meeting-reschedule",
    title: "회의 일정 변경 요청하기",
    category: "work",
    levelMin: 2,
    levelMax: 3,
    durationMin: 8,
    version: 1,
    scenario: {
      summaryKo: "급한 일이 생겨 회의 시간을 바꿔 달라고 정중하게 요청해요.",
      backgroundKo:
        "내일 오전 10시에 협력사 담당자와 화상 회의가 잡혀 있어요. 그런데 같은 시간에 급한 내부 일정이 생겼어요. 담당자에게 전화로 사정을 설명하고 다른 시간을 제안하세요.",
      aiRole: "a project manager at a partner company",
      userRole: "a project coordinator who needs to move a meeting",
      setting: "A short phone call between two companies.",
      openingLine: "Hi, this is Jordan speaking. What can I do for you?",
      learningPointsKo: ["용건을 정중하게 꺼내기", "이유 설명하기", "대안 시간 제안하고 확정하기"],
      hintPhrases: [
        "I'm calling about our meeting tomorrow at ten.",
        "Something urgent has come up, so I was wondering if we could reschedule.",
        "Would Thursday afternoon work for you?",
        "Great, I'll send an updated invite.",
      ],
      mockScript: [
        "Oh, sure. What's going on?",
        "I understand, these things happen. When would work better for you?",
        "Let me check my calendar... Thursday at two works for me.",
        "Sounds good. Thanks for letting me know in advance.",
      ],
      mockClosing: "Talk to you on Thursday, then. Bye for now!",
      goalsAffinity: ["work"],
    },
    successCriteria: [
      {
        id: "state_purpose",
        descriptionKo: "회의 일정 때문에 연락했다고 말한다",
        mockPatterns: ["meeting", "calling about", "reschedule", "move"],
      },
      {
        id: "give_reason",
        descriptionKo: "일정을 바꿔야 하는 이유를 말한다",
        mockPatterns: ["because", "come up", "came up", "urgent", "conflict", "something"],
      },
      {
        id: "propose_time",
        descriptionKo: "다른 시간을 제안하거나 확정한다",
        mockPatterns: ["monday", "tuesday", "wednesday", "thursday", "friday", "afternoon", "morning", "work for you", "o'clock", "pm", "am"],
      },
    ],
  },
  {
    id: "m-clinic-appointment",
    slug: "clinic-appointment",
    title: "병원 진료 예약하기",
    category: "service",
    levelMin: 1,
    levelMax: 2,
    durationMin: 6,
    version: 1,
    scenario: {
      summaryKo: "전화로 증상을 설명하고 진료 예약을 잡아요.",
      backgroundKo:
        "며칠째 목이 아프고 열이 조금 있어요. 집 근처 병원에 전화해 진료 예약을 하려고 해요. 증상을 간단히 말하고 가능한 시간을 정한 뒤, 이름이나 연락처를 알려 주세요. 실제 개인정보 대신 가상의 이름을 써도 돼요.",
      aiRole: "a receptionist at a local clinic",
      userRole: "a patient calling to book an appointment",
      setting: "A phone call to a clinic front desk.",
      openingLine: "Good morning, Green Valley Clinic. How can I help you?",
      learningPointsKo: ["예약 요청하기", "증상 설명하기", "가능한 시간 맞추기"],
      hintPhrases: [
        "I'd like to make an appointment, please.",
        "I've had a sore throat for a few days.",
        "Do you have anything available this afternoon?",
        "My name is ...",
      ],
      mockScript: [
        "Of course. Can you tell me a little about what's going on?",
        "I'm sorry you're not feeling well. We have openings at three or four thirty today. Which is better?",
        "Okay. Can I have your name, please?",
        "Thank you. You're booked. Please arrive ten minutes early.",
      ],
      mockClosing: "We'll see you later today. Feel better soon!",
      goalsAffinity: ["daily", "travel"],
    },
    successCriteria: [
      {
        id: "request_appointment",
        descriptionKo: "진료 예약을 요청한다",
        mockPatterns: ["appointment", "book", "see a doctor", "schedule"],
      },
      {
        id: "describe_symptom",
        descriptionKo: "증상을 설명한다",
        mockPatterns: ["sore", "throat", "fever", "cough", "headache", "hurt", "pain", "sick"],
      },
      {
        id: "choose_time",
        descriptionKo: "예약 시간을 고른다",
        mockPatterns: ["three", "four", "3", "4", "thirty", "afternoon", "morning", "works", "better"],
      },
    ],
  },
  {
    id: "m-neighbor-noise",
    slug: "neighbor-noise",
    title: "이웃에게 소음 문제 이야기하기",
    category: "daily",
    levelMin: 2,
    levelMax: 3,
    durationMin: 8,
    version: 1,
    scenario: {
      summaryKo: "위층 이웃에게 밤 소음을 기분 상하지 않게 이야기해요.",
      backgroundKo:
        "요즘 밤늦게 위층에서 음악 소리가 들려서 잠을 설쳐요. 계단에서 마주친 위층 이웃에게 정중하게 상황을 이야기하고, 서로 괜찮은 해결 방법을 찾아보세요.",
      aiRole: "an upstairs neighbor who didn't realize they were loud",
      userRole: "a resident who has trouble sleeping because of noise",
      setting: "The stairway of an apartment building in the evening.",
      openingLine: "Oh, hi! I don't think we've properly met. I live upstairs.",
      learningPointsKo: ["부드럽게 말 꺼내기", "문제를 구체적으로 설명하기", "함께 해결책 정하기"],
      hintPhrases: [
        "Nice to meet you. Actually, I wanted to mention something.",
        "I've been hearing music late at night, around midnight.",
        "Would you mind turning it down after eleven?",
        "Thanks for understanding.",
      ],
      mockScript: [
        "Nice to meet you too! Is everything okay?",
        "Oh no, I had no idea it was that loud. I'm really sorry.",
        "That's totally fair. I can keep it down after eleven. Would that help?",
        "Of course. Please just knock if it ever happens again.",
      ],
      mockClosing: "Thanks for telling me so kindly. Have a good night!",
      goalsAffinity: ["daily"],
    },
    successCriteria: [
      {
        id: "open_politely",
        descriptionKo: "부드럽게 이야기를 꺼낸다",
        mockPatterns: ["actually", "wanted to", "mention", "talk to you", "sorry to bother", "nice to meet"],
      },
      {
        id: "describe_issue",
        descriptionKo: "소음 문제를 구체적으로 설명한다",
        mockPatterns: ["music", "noise", "loud", "night", "midnight", "sleep"],
      },
      {
        id: "agree_solution",
        descriptionKo: "해결 방법을 제안하거나 동의한다",
        mockPatterns: ["would you mind", "could you", "turn it down", "keep it down", "after", "thank", "that would help"],
      },
    ],
  },
];
