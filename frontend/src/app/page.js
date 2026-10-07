import HomeClient from "@/components/home/HomeClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

async function getInitialHomeData() {
  try {
    const [repsRes, photosRes, thoughtsRes] = await Promise.allSettled([
      fetch(`${API_BASE_URL}/api/representatives`, { cache: "no-store" }),
      fetch(`${API_BASE_URL}/api/landing-photos`, { cache: "no-store" }),
      fetch(`${API_BASE_URL}/api/thoughts`, { cache: "no-store" }),
    ]);

    let representatives = [];
    if (repsRes.status === "fulfilled" && repsRes.value.ok) {
      representatives = await repsRes.value.json().catch(() => []);
    }

    let landingPhotos = [];
    if (photosRes.status === "fulfilled" && photosRes.value.ok) {
      landingPhotos = await photosRes.value.json().catch(() => []);
    }

    let thoughts = [];
    if (thoughtsRes.status === "fulfilled" && thoughtsRes.value.ok) {
      thoughts = await thoughtsRes.value.json().catch(() => []);
    }

    return { representatives, landingPhotos, thoughts };
  } catch (err) {
    console.error("Failed to fetch initial home data:", err);
    return { representatives: [], landingPhotos: [], thoughts: [] };
  }
}

export default async function HomePage() {
  const { representatives, landingPhotos, thoughts } = await getInitialHomeData();

  return (
    <HomeClient
      initialRepresentatives={representatives}
      initialLandingPhotos={landingPhotos}
      initialThoughts={thoughts}
    />
  );
}