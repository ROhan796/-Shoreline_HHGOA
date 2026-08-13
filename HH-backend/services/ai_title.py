import httpx
import logging
from config import settings

logger = logging.getLogger("hh-backend.ai_title")

FALLBACK_TITLES = [
    "The Async Alchemist",
    "Kernel Shaman",
    "Zero-Knowledge Surfer",
    "Protocol Architect",
    "Byte-Sized Nomad",
    "Neural Tide Navigator",
    "Consensus Weaver",
    "Distributed Beachcomber",
    "Rust Wave Specialist",
    "DeFi Tide Rider",
    "Consensus Architect",
    "Protocol Phantom",
    "Distributed Tamer",
    "Neural Net Navigator",
]


def _get_fallback_title() -> str:
    import random
    return random.choice(FALLBACK_TITLES)


async def generate_title(stack: str, name: str, role: str) -> tuple[str, str]:
    if not settings.is_gemini_configured:
        return _get_fallback_title(), "fallback"

    try:
        prompt = f"""You are the witty, punchy AI title generator for Shoreline.
The aesthetic is "Brutalist Tropics" — hacker directness meets electric Goa energy.
Generate ONE short, ultra-cool 2-4 word "Builder Title" for a hackathon attendee based on their details:
Name: {name or 'Anonymous Hacker'}
Stack/Role: {stack or role or 'Full Stack Developer'}

Rules:
1. Title must be 2 to 4 words maximum.
2. Must sound impressive, witty, or hacker-chic (e.g., "The Async Alchemist", "Kernel Shaman", "Zero-Knowledge Surfer", "Rust Wave Specialist", "DeFi Tide Rider", "Consensus Weaver").
3. DO NOT use quotes or punctuation marks around the title.
4. Output ONLY the raw title string, nothing else."""

        api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={settings.GEMINI_API_KEY}"

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                api_url,
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.9},
                },
                timeout=15,
            )

            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        title = parts[0].get("text", "").strip().strip('"').strip("'")
                        if title:
                            logger.info(f"Gemini generated title: {title}")
                            return title, "gemini"

            logger.warning(f"Gemini API returned status {resp.status_code}")
            return _get_fallback_title(), "fallback_error"

    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        return _get_fallback_title(), "fallback_error"
