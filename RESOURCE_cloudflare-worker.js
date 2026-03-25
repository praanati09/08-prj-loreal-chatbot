export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    try {
      if (!env.OPENAI_API_KEY) {
        return new Response(
          JSON.stringify({
            error: "Missing OPENAI_API_KEY in Cloudflare secrets",
          }),
          {
            status: 500,
            headers: corsHeaders,
          },
        );
      }

      const body = await request.json();
      const messages = body.messages || [];

      console.log("Incoming messages:", messages);

      const openAIResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: messages,
            temperature: 0.7,
            max_tokens: 350,
          }),
        },
      );

      const data = await openAIResponse.json();

      console.log("OpenAI status:", openAIResponse.status);
      console.log("OpenAI response:", data);

      if (!openAIResponse.ok) {
        return new Response(
          JSON.stringify({
            error: data.error?.message || "OpenAI request failed",
          }),
          {
            status: openAIResponse.status,
            headers: corsHeaders,
          },
        );
      }

      const reply =
        data.choices?.[0]?.message?.content ||
        "Sorry, I couldn't generate a response.";

      return new Response(JSON.stringify({ reply }), {
        status: 200,
        headers: corsHeaders,
      });
    } catch (error) {
      console.log("Worker error:", error);

      return new Response(
        JSON.stringify({
          error: error.message || "Internal server error",
        }),
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }
  },
};
