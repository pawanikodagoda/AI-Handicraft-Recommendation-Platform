"""
Smart Product Tagging service (NLP).

Reads a seller's free-text product description and extracts structured
attributes: category, materials, colors and style/occasion tags. The
Laravel backend calls POST /tag and shows the results to the seller for
review before the product is published (see proposal section 5.1).
"""
import re
from typing import List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from taxonomy import (
    CATEGORY_KEYWORDS,
    COLOR_KEYWORDS,
    DEFAULT_CATEGORY,
    MATERIAL_KEYWORDS,
    STYLE_TAG_KEYWORDS,
)

app = FastAPI(title="Smart Product Tagging Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class TagRequest(BaseModel):
    description: str = Field(..., min_length=1, max_length=2000)
    title: str = ""


class TagResponse(BaseModel):
    category: str
    materials: List[str]
    colors: List[str]
    style_tags: List[str]
    tags: List[str]


def _normalize(text: str) -> str:
    return re.sub(r"[^a-z0-9\s'-]", " ", text.lower())


def _match_keywords(text: str, keyword_map: dict) -> List[str]:
    matches = []
    for canonical, synonyms in keyword_map.items():
        for kw in synonyms:
            pattern = r"\b" + re.escape(kw) + r"\b"
            if re.search(pattern, text):
                matches.append(canonical)
                break
    return matches


def _detect_category(text: str) -> str:
    for canonical, synonyms in CATEGORY_KEYWORDS.items():
        for kw in synonyms:
            if re.search(r"\b" + re.escape(kw) + r"\b", text):
                return canonical
    return DEFAULT_CATEGORY


@app.get("/health")
def health():
    return {"status": "ok", "service": "tagging-service"}


@app.post("/tag", response_model=TagResponse)
def tag_product(payload: TagRequest):
    text = _normalize(f"{payload.title} {payload.description}")

    category = _detect_category(text)
    materials = _match_keywords(text, MATERIAL_KEYWORDS)
    colors = _match_keywords(text, COLOR_KEYWORDS)
    style_tags = _match_keywords(text, STYLE_TAG_KEYWORDS)

    # Flat "tags" list used for search/browse chips - style tags plus the
    # category itself, deduplicated, capped to keep listings readable.
    tags = list(dict.fromkeys(style_tags + [category]))[:8]

    return TagResponse(
        category=category,
        materials=materials,
        colors=colors,
        style_tags=style_tags,
        tags=tags,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
