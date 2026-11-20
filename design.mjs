export default async (req) => {
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed." }), { status: 405, headers: { "content-type": "application/json" } });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: "AI service is not configured. Add OPENAI_API_KEY in Netlify environment variables, then redeploy." }), { status: 503, headers: { "content-type": "application/json" } });
  try {
    const form = await req.formData();
    const prompt = String(form.get("prompt") || "").trim();
    const image = form.get("image");
    if (!prompt) return new Response(JSON.stringify({ error: "Please provide a design description." }), { status: 400, headers: { "content-type": "application/json" } });
    if (prompt.length > 12000) return new Response(JSON.stringify({ error: "Please shorten your design description." }), { status: 400, headers: { "content-type": "application/json" } });

    let endpoint = "https://api.openai.com/v1/images/generations";
    let payload;
    const headers = { Authorization: `Bearer ${apiKey}` };
    if (image && typeof image.arrayBuffer === "function" && image.size > 0) {
      endpoint = "https://api.openai.com/v1/images/edits";
      payload = new FormData();
      payload.append("model", "gpt-image-2.5-sunburst");
      payload.append("prompt", `Use the uploaded image as a visual reference. Create a new design based on this brief while retaining the important requested elements. ${prompt}`);
      payload.append("image", image, image.name || "reference.png");
      payload.append("size", "1024x1024");
    } else {
      headers["content-type"] = "application/json";
      payload = JSON.stringify({ model: "gpt-image-2.5-flare", prompt, size: "1024x1024", quality: "high", n: 1 });
    }
    const upstream = await fetch(endpoint, { method: "POST", headers, body: payload });
    const result = await upstream.json();
    if (!upstream.ok) {
      const message = result?.error?.message || "The image service could not complete this request.";
      return new Response(JSON.stringify({ error: message }), { status: upstream.status, headers: { "content-type": "application/json" } });
    }
    const imageBase64 = result?.data?.[0]?.b64_json;
    if (!imageBase64) return new Response(JSON.stringify({ error: "The image service returned no image. Please try again." }), { status: 502, headers: { "content-type": "application/json" } });
    return new Response(JSON.stringify({ image: imageBase64, mimeType: "image/png" }), { status: 200, headers: { "content-type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error?.message || "Unexpected server error." }), { status: 500, headers: { "content-type": "application/json" } });
  }
};
