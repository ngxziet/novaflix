const releasesUrl = "https://github.com/ngxziet/novaflix/releases";
const apkFilename = "NovaFlix.apk";

export async function GET() {
  let downloadUrl = `${releasesUrl}/latest/download/${apkFilename}`;

  try {
    const response = await fetch("https://api.github.com/repos/ngxziet/novaflix/releases/latest", {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(3000),
    });
    if (response.ok) {
      const { tag_name: tag } = (await response.json()) as { tag_name?: unknown };
      if (typeof tag === "string" && /^android-v\d+\.\d+\.\d+$/.test(tag)) {
        downloadUrl = `${releasesUrl}/download/${tag}/${apkFilename}`;
      }
    }
  } catch {
    // GitHub's public download link also works if the release API is unavailable.
  }

  return new Response(null, {
    status: 307,
    headers: { Location: downloadUrl, "Cache-Control": "no-store" },
  });
}
