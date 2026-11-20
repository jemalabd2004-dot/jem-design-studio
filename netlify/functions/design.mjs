
const MODEL = "gpt-image-2.5-flare";

export default async function handler(request) {
  const respond = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" }
    });

  if (request.method !== "POST") {
    return respond({ error: "POST method required." }, 405);
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return respond({
      error: "OPENAI_API_KEY is missing. Add it in Netlify."
    }, 500);
  }

  try {
    const incoming = await request.formData();
    const prompt = String(incoming.get("prompt") || "").trim();
    const image = incoming.get("image");

    if (!prompt) {
      return respond({ error: "Please describe your design." }, 400);
    }

    if (prompt.length > 30000) {
      return respond({ error: "Description is too long." }, 400);
    }

    let response;

    if (image && typeof image.arrayBuffer === "function") {
      if (image.size > 4 * 1024 * 1024) {
        return respond({
          error: "Reference image must be smaller than 4 MB."
        }, 413);
      }

      if (!["image/png", "image/jpeg", "image/webp"].includes(image.type)) {
        return respond({ error: "Unsupported reference image." }, 400);
      }

      const form = new FormData();
      form.append("model", MODEL);
      form.append("prompt", prompt);
      form.append("size", "1024x1024");
      form.append("quality", "high");
      form.append("image", image, image.name || "reference.png");

      response = await fetch(
        "https://api.openai.com/v1/images/edits",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`
          },
          body: form
        }
      );
    } else {
      response = await fetch(
        "https://api.openai.com/v1/images/generations",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: MODEL,
            prompt,
            size: "1024x1024",
            quality: "high",
            n: 1
          })
        }
      );
    }

    const result = await response.json();

    if (!response.ok) {
      return respond({
        error: result.error?.message || "AI generation failed."
      }, response.status);
    }

    const imageData = result.data?.[0]?.b64_json;

    if (!imageData) {
      return respond({ error: "AI returned no image." }, 502);
    }

    return respond({
      image: imageData,
      mimeType: "image/png"
    });

  } catch (error) {
    console.error(error);

    return respond({
      error: error.message || "Unexpected server error."
    }, 500);
  }
}
