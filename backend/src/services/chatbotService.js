const axios = require("axios")

const chatbotRules = {
  intents: {
    greeting: {
      patterns: ["hello", "hi", "hey", "good morning", "good afternoon"],
      responses: [
        "Hello! I'm here to help you navigate TalentTrade. What would you like to know?",
        "Hi there! Welcome to TalentTrade. How can I assist you today?",
        "Hey! I'm your TalentTrade assistant. What can I help you with?",
      ],
    },
    howToStart: {
      patterns: ["how to start", "getting started", "begin", "first steps"],
      responses: [
        "Great question! Here's how to get started:\n1. Complete your profile with skills and interests\n2. Browse potential matches\n3. Send a trade request\n4. Start exchanging knowledge!\n\nWould you like me to guide you through any of these steps?",
      ],
    },
    createSkill: {
      patterns: ["add skill", "create skill", "new skill", "skill"],
      responses: [
        "To add a skill:\n1. Go to 'My Skills' in the navigation\n2. Click 'Add New Skill'\n3. Enter the skill name, category, and your proficiency level\n4. Add relevant tags\n\nThis helps others find you for skill exchanges!",
      ],
    },
    matching: {
      patterns: ["how matching works", "find matches", "discover users"],
      responses: [
        "Our matching system finds users based on:\n• Complementary skills (what you offer vs what they need)\n• Shared interests\n• Location proximity\n• Availability overlap\n\nCheck the 'Discover' page to see your recommended matches!",
      ],
    },
    messaging: {
      patterns: ["chat", "message", "talk", "communicate"],
      responses: [
        "Once you have an active exchange, you can:\n• Send real-time messages\n• See when the other person is typing\n• Know when they've read your messages\n• Start video calls for live learning sessions",
      ],
    },
    videoCall: {
      patterns: ["video call", "call", "video chat", "webcam"],
      responses: [
        "Video calls are perfect for skill exchanges! In any active exchange:\n1. Click the video call button\n2. Wait for the other person to accept\n3. Use controls to mute/unmute, turn video on/off, or share your screen\n\nMake sure to allow camera and microphone permissions!",
      ],
    },
    safety: {
      patterns: ["safety", "report", "block", "inappropriate"],
      responses: [
        "Your safety is important:\n• Never share personal information like addresses or phone numbers\n• Meet in public places if meeting in person\n• Report inappropriate behavior using the report button\n• You can block users who make you uncomfortable\n\nIf you need immediate help, contact our support team.",
      ],
    },
    faq: {
      patterns: ["faq", "questions", "help", "support"],
      responses: [
        "Here are some common questions:\n• How do I add skills? Say 'create skill'\n• How does matching work? Say 'matching'\n• How to start video calls? Say 'video call'\n• Safety tips? Say 'safety'\n\nWhat specific topic interests you?",
      ],
    },
  },
}

const processMessage = async (message, userId) => {
  const lowerMessage = message.toLowerCase()

  // Find matching intent
  for (const [intentName, intent] of Object.entries(chatbotRules.intents)) {
    for (const pattern of intent.patterns) {
      if (lowerMessage.includes(pattern)) {
        const response = intent.responses[Math.floor(Math.random() * intent.responses.length)]
        return {
          response,
          intent: intentName,
          confidence: 0.8,
        }
      }
    }
  }

  // If OpenAI API key is available, try enhanced response
  if (process.env.OPENAI_API_KEY) {
    try {
      const enhancedResponse = await getOpenAIResponse(message)
      return {
        response: enhancedResponse,
        intent: "ai_enhanced",
        confidence: 0.9,
      }
    } catch (error) {
      console.error("OpenAI API error:", error)
    }
  }

  // Default fallback
  return {
    response:
      "I'm not sure about that specific question. Try asking about:\n• Getting started\n• Adding skills\n• How matching works\n• Video calls\n• Safety tips\n\nOr type 'help' for more options!",
    intent: "fallback",
    confidence: 0.3,
  }
}

const getOpenAIResponse = async (message) => {
  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant for TalentTrade, a peer-to-peer skill exchange platform. Help users with questions about creating profiles, adding skills, finding matches, messaging, video calls, and platform safety. Keep responses concise and actionable.",
        },
        {
          role: "user",
          content: message,
        },
      ],
      max_tokens: 200,
      temperature: 0.7,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    },
  )

  return response.data.choices[0].message.content
}

module.exports = { processMessage, chatbotRules }
