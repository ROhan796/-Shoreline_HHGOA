import psycopg2
from nanoid import generate
from config import settings

SEED_DATA = [
    {"name": "Rohan Manna", "role": "Full Stack · Rust", "title": "Async Alchemist", "format": "B"},
    {"name": "Priya Kapoor", "role": "AI Engineer · PyTorch", "title": "Kernel Shaman", "format": "A"},
    {"name": "Alex Chen", "role": "Smart Contracts · Solidity", "title": "Zero-Knowledge Surfer", "format": "B"},
    {"name": "Vikram Sethi", "role": "Design Systems · Tailwind", "title": "Solana Sunbather", "format": "A"},
    {"name": "Aarav Patel", "role": "DevOps · K8s", "title": "DeFi Tide Rider", "format": "B"},
    {"name": "Maya Lin", "role": "Zero Knowledge", "title": "Prompt Engineer @ Beach 4", "format": "A"},
    {"name": "Karan Verma", "role": "Backend · Go", "title": "Rust Wave Specialist", "format": "B"},
    {"name": "Siddharth R.", "role": "Frontend · React", "title": "Byte-Sized Nomad", "format": "A"},
    {"name": "Nisha Desai", "role": "ML Engineer · TensorFlow", "title": "Neural Net Navigator", "format": "B"},
    {"name": "Arjun Mehta", "role": "iOS · Swift", "title": "Consensus Architect", "format": "B"},
    {"name": "Fatima Khan", "role": "Security · Cryptography", "title": "Protocol Phantom", "format": "A"},
    {"name": "Dev Sharma", "role": "Data Engineering · Spark", "title": "Distributed Tamer", "format": "B"},
]


def run_seed():
    if not settings.is_db_configured:
        print("[SEED] No DATABASE_URL configured, skipping seed")
        return False

    try:
        conn = psycopg2.connect(settings.DATABASE_URL)
        cur = conn.cursor()

        cur.execute("SELECT COUNT(*) FROM generations")
        count = cur.fetchone()[0]
        if count > 0:
            print(f"[SEED] Database already has {count} records, skipping seed")
            cur.close()
            conn.close()
            return True

        import random
        from datetime import datetime, timedelta

        for item in SEED_DATA:
            card_id = generate(size=10)
            hours_ago = random.randint(0, 48)
            created_at = datetime.now() - timedelta(hours=hours_ago)
            share_count = random.randint(3, 28)

            cur.execute(
                """INSERT INTO generations (id, slug, format, name, role, ai_title, image_url, storage_type, share_count, created_at)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, 'local', %s, %s)""",
                (card_id, card_id, item["format"], item["name"], item["role"],
                 item["title"], "", share_count, created_at),
            )

        conn.commit()
        cur.close()
        conn.close()
        print(f"[SEED] Seeded {len(SEED_DATA)} demo cards")
        return True
    except Exception as e:
        print(f"[SEED] Seed failed: {e}")
        return False


if __name__ == "__main__":
    run_seed()
