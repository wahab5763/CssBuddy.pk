import time
from typing import Optional

import feedparser

from app.core.config import settings

_cache: dict[str, tuple[float, list[dict]]] = {}

RSS_SOURCES: dict[str, list[str]] = {
    "Current Affairs": [
        "https://www.dawn.com/feeds/home",
        "https://feeds.bbci.co.uk/news/world/rss.xml",
    ],
    "Pakistan Affairs": [
        "https://www.geo.tv/rss/1/news",
    ],
    "Islamic Studies": [
        "https://www.islamicfinder.org/feed/",
    ],
    "English": [
        "https://feeds.bbci.co.uk/news/rss.xml",
    ],
    "General Science & Ability": [
        "https://www.sciencedaily.com/rss/all.xml",
    ],
}


def fetch_news(subjects: list[str], limit: int = 20) -> list[dict]:
    cache_key = ",".join(sorted(subjects))
    ttl = settings.rss_cache_minutes * 60
    now = time.time()

    if cache_key in _cache:
        ts, articles = _cache[cache_key]
        if now - ts < ttl:
            return articles[:limit]

    articles: list[dict] = []
    for subject in subjects:
        for url in RSS_SOURCES.get(subject, []):
            try:
                feed = feedparser.parse(url)
                for entry in feed.entries[:8]:
                    articles.append(
                        {
                            "title": entry.get("title", ""),
                            "summary": entry.get("summary", "")[:300],
                            "link": entry.get("link", ""),
                            "published": entry.get("published", ""),
                            "source": feed.feed.get("title", url),
                            "subject": subject,
                        }
                    )
            except Exception:
                pass

    _cache[cache_key] = (now, articles)
    return articles[:limit]


def invalidate_cache() -> None:
    _cache.clear()
