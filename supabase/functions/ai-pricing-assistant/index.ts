import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, products, customers } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing AI pricing assistant request with", messages.length, "messages");

    const systemPrompt = `Kamu adalah AI Assistant untuk sistem FurniPrice - sistem kalkulasi harga jual furniture profesional.

Tugas utamamu:
1. Membantu menghitung harga jual furniture berdasarkan spesifikasi produk
2. Memberikan rekomendasi diskon yang tepat berdasarkan jenis pelanggan
3. Menyarankan margin keuntungan yang optimal
4. Menjawab pertanyaan tentang pricing strategy untuk furniture

Data Produk yang tersedia:
${JSON.stringify(products || [], null, 2)}

Data Pelanggan yang tersedia:
${JSON.stringify(customers || [], null, 2)}

Panduan Pricing:
- Margin standar: 15-25% untuk retail, 10-15% untuk wholesale
- Diskon maksimal biasanya 20% untuk pelanggan VIP
- Pertimbangkan biaya material, kompleksitas desain, dan waktu produksi

Selalu berikan jawaban dalam Bahasa Indonesia yang jelas dan informatif.
Format angka harga dalam Rupiah (Rp) dengan separator ribuan.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Streaming response from AI gateway");
    
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI pricing assistant error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
