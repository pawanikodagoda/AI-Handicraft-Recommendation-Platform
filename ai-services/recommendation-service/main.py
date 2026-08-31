"""
Personalized Recommendations service.

Scores and ranks products against a customer's stated preferences
(colour, material, style, budget, occasion) - proposal section 5.2.
The Laravel backend sends the customer's preferences plus the candidate
product list (already loaded from MySQL) and gets back a ranked order.

If the customer skipped the preference questionnaire (empty prefs), the
service falls back to ranking by recency + popularity so the homepage is
still useful.
"""
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Recommendation Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Relative importance of each signal when a customer has preferences set.
WEIGHTS = {
    "color": 0.40,
    "material": 0.40,
    "style": 0.20,
}


class Preferences(BaseModel):
    colors: List[str] = []
    materials: List[str] = []
    styles: List[str] = []


class Product(BaseModel):
    id: int
    price: float
    colors: List[str] = []
    materials: List[str] = []
    style_tags: List[str] = []
    created_at: Optional[str] = None
    popularity_score: float = 0.0


class RecommendRequest(BaseModel):
    preferences: Optional[Preferences] = None
    products: List[Product]
    limit: int = Field(default=50, ge=1, le=200)


class ScoredProduct(BaseModel):
    id: int
    score: float


class RecommendResponse(BaseModel):
    personalized: bool
    ranked_product_ids: List[ScoredProduct]


def _overlap_ratio(wanted: List[str], has: List[str]) -> float:
    if not wanted:
        return 0.0
    wanted_set = {w.lower() for w in wanted}
    has_set = {h.lower() for h in has}
    if not wanted_set:
        return 0.0
    return len(wanted_set & has_set) / len(wanted_set)


def _score_personalized(prefs: Preferences, product: Product) -> float:
    color_s = _overlap_ratio(prefs.colors, product.colors)
    material_s = _overlap_ratio(prefs.materials, product.materials)
    style_s = _overlap_ratio(prefs.styles, product.style_tags)

    return (
        WEIGHTS["color"] * color_s
        + WEIGHTS["material"] * material_s
        + WEIGHTS["style"] * style_s
    )


def _parse_dt(value: Optional[str]) -> datetime:
    if not value:
        return datetime.fromtimestamp(0, tz=timezone.utc)
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except ValueError:
        return datetime.fromtimestamp(0, tz=timezone.utc)


def _score_fallback(product: Product) -> float:
    now = datetime.now(timezone.utc)
    age_days = max((now - _parse_dt(product.created_at)).total_seconds() / 86400, 0)
    recency_s = 1.0 / (1.0 + age_days / 14)  # ~half weight after 2 weeks
    popularity_s = min(product.popularity_score / 100.0, 1.0)
    return 0.6 * recency_s + 0.4 * popularity_s


@app.get("/health")
def health():
    return {"status": "ok", "service": "recommendation-service"}


@app.post("/recommend", response_model=RecommendResponse)
def recommend(payload: RecommendRequest):
    has_prefs = payload.preferences is not None and any(
        [
            payload.preferences.colors,
            payload.preferences.materials,
            payload.preferences.styles,
        ]
    )

    if has_prefs:
        scored = [
            ScoredProduct(id=p.id, score=round(_score_personalized(payload.preferences, p), 4))
            for p in payload.products
        ]
    else:
        scored = [
            ScoredProduct(id=p.id, score=round(_score_fallback(p), 4))
            for p in payload.products
        ]

    scored.sort(key=lambda s: s.score, reverse=True)
    return RecommendResponse(personalized=has_prefs, ranked_product_ids=scored[: payload.limit])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)
