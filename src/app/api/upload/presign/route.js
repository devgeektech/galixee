export async function POST() {
  const secureExpire = Math.floor(Date.now() / 1000) + 15 * 60; // +15 minutes
  const secureSignature = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  return Response.json({ secureSignature, secureExpire });
}
