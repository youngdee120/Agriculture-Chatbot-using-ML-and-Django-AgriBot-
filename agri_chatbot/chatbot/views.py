# chatbot/views.py

import os
import re
import json
import csv
import datetime               # ← make sure this is here
import requests
from base64 import b64encode

from bs4 import BeautifulSoup
import torch
from django.conf import settings
from django.http import JsonResponse, HttpResponseBadRequest
from django.shortcuts import render
from django.views.decorators.http import require_GET
from transformers import T5ForConditionalGeneration

# ─── 0) Load static Q&A data ─────────────────────────────────────────────────
DATA_FILE = os.path.join(settings.BASE_DIR, "data", "data.json")
try:
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        STATIC_RESPONSES = json.load(f)
except FileNotFoundError:
    STATIC_RESPONSES = {}

def rule_based_response(text: str) -> str:
    tl = text.lower()
    for pattern, resp in STATIC_RESPONSES.items():
        if re.search(pattern, tl):
            return resp
    return None

# ─── 2) Gemini via API key ───────────────────────────────────────────────────
API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-1.5-flash:generateContent"
    f"?key={settings.GEMINI_API_KEY}"
)
SYSTEM_PROMPT = (
    "You are AgriBot Assistant, an expert in Kenyan agriculture. "
    "Provide clear, actionable advice."
)

def make_payload(user_message: str, image_bytes: bytes = None, mime: str = None) -> dict:
    contents = [{"parts": [{"text": f"{SYSTEM_PROMPT}\n\nUser: {user_message}"}]}]
    if image_bytes and mime:
        contents[0]["parts"].append({
            "inline_data": {
                "mime_type": mime,
                "data": b64encode(image_bytes).decode('utf-8')
            }
        })
    return {"contents": contents}

def gemini_answer(prompt: str, image_bytes: bytes = None, mime: str = None) -> str:
    payload = make_payload(prompt, image_bytes, mime)
    resp = requests.post(API_URL, headers={"Content-Type": "application/json"}, json=payload, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    return data["candidates"][0]["content"]["parts"][0]["text"].strip()

# ─── 3) T5 fallback ───────────────────────────────────────────────────────────
_MODEL = None
_TOKENIZER = None

def _load_t5():
    global _MODEL, _TOKENIZER
    if _MODEL is None or _TOKENIZER is None:
        model_dir = os.path.join(settings.BASE_DIR, "chatbot", "model", "t5_agri_final")
        _MODEL = T5ForConditionalGeneration.from_pretrained(model_dir).to(
            torch.device("cuda" if torch.cuda.is_available() else "cpu")
        )
        with open(os.path.join(model_dir, "tokenizer.pkl"), "rb") as f:
            _TOKENIZER = pickle.load(f)
    return _MODEL, _TOKENIZER

def t5_respond(query: str, num_beams: int = 5) -> str:
    model, tokenizer = _load_t5()
    inputs = tokenizer(query, return_tensors="pt").to(model.device)
    out_ids = model.generate(
        **inputs,
        max_length=128,
        num_beams=num_beams,
        repetition_penalty=2.5,
        no_repeat_ngram_size=3,
        length_penalty=1.0,
        early_stopping=True
    )[0]
    raw = tokenizer.decode(out_ids, skip_special_tokens=True)
    return " ".join(raw.replace("<pad>", "").split())

# ─── HTML‐Scraping “Download Prices” Page ────────────────────────────────────
KILIMOSTAT_HTML_URL = "https://statistics.kilimo.go.ke/en/kilimostat-api/download_prices/"

def _fetch_all_data():
    """
    Scrape the market‐prices table from the KilimoSTAT download page.
    Returns a list of dicts, one per row.
    """
    resp = requests.get(KILIMOSTAT_HTML_URL, headers={"User-Agent":"Mozilla/5.0"}, timeout=10)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    table = soup.find("table")
    if not table:
        raise ValueError("Could not find the data table on the KilimoSTAT page.")

    # Extract headers
    headers = [th.get_text(strip=True) for th in table.find("thead").find_all("th")]

    data = []
    for tr in table.find("tbody").find_all("tr"):
        cells = [td.get_text(strip=True) for td in tr.find_all("td")]
        if len(cells) != len(headers):
            continue
        row = dict(zip(headers, cells))
        data.append(row)

    if not data:
        raise ValueError("Table found but no data rows were parsed.")
    return data

@require_GET
def raw_market_data(request):
    """
    GET /chatbot/api/market_raw/
    Return first 5 scraped entries so you can inspect structure.
    """
    try:
        data = _fetch_all_data()
        print("[DEBUG] raw_market_data headers:", list(data[0].keys()))
        return JsonResponse({"sample": data[:5]})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@require_GET
def api_market_prices(request):
    """
    GET /chatbot/api/market_prices/?commodity=...&county=...
    Scrapes live HTML table and filters by commodity & county.
    """
    commodity = request.GET.get("commodity", "").strip().lower()
    county    = request.GET.get("county",    "all").strip().lower()

    if not commodity:
        return JsonResponse({"error": "Please supply a commodity parameter"}, status=400)

    try:
        all_data = _fetch_all_data()

        def get_field(row, key):
            return row.get(key, "").strip()

        # 1) Filter by commodity substring
        matches = [r for r in all_data if commodity in get_field(r, "Commodity").lower()]

        # 2) Filter by county if requested
        if county != "all":
            county_matches = [r for r in matches if county == get_field(r, "County").lower()]
            filtered = county_matches or matches
        else:
            filtered = matches

        # 3) Sort by date descending
        filtered.sort(key=lambda r: get_field(r, "Date"), reverse=True)

        # 4) Build results
        results = []
        for r in filtered:
            results.append({
                "date":      get_field(r, "Date"),
                "county":    get_field(r, "County"),
                "market":    get_field(r, "Market"),
                "commodity": get_field(r, "Commodity"),
                "price":     get_field(r, "Price (KES)") or get_field(r, "Price")
            })

        return JsonResponse({"results": results})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

# ─── 5) Index & Chat Views ──────────────────────────────────────────────────
def index(request):
    counties = [
        {"slug": "all",     "name": "All Counties"},
        {"slug": "nairobi", "name": "Nairobi"},
        {"slug": "mombasa", "name": "Mombasa"},
    ]
    carousel_items = [
        {"image": "assets/chatbot.png", "alt": "Chatbot Interface", "caption": "AgriBot Smart Chat"},
        {"image": "assets/market1.jpg", "alt": "Fresh Produce",      "caption": "Fresh Produce Listings"},
        {"image": "assets/market2.jpg", "alt": "Price Ticker",        "caption": "Live Price Ticker"},
        {"image": "assets/market3.jpg", "alt": "Logistics",           "caption": "Logistics & Fulfilment"},
    ]
    modules = [
        {"title": "User & Identity",   "points": ["Multi-role signup", "Huduma Namba KYC", "USSD Mobile Flow"]},
        {"title": "Products & Services","points": ["Certified Seeds", "Fertilizers & Agrochemicals", "Advisory Services"]},
        {"title": "Market Mechanics",   "points": ["Search & Filters", "Auction & Fixed Prices", "Order Management"]},
        {"title": "Payments & Escrow",  "points": ["M-Pesa & Airtel Money", "Escrow Service", "Automated Invoicing"]},
    ]
    return render(request, "chatbot/index.html", {
        "counties": counties,
        "carousel_items": carousel_items,
        "modules": modules,
    })

def chat_interface(request):
    return render(request, "chatbot/chatbot.html")

def chat_api(request):
    try:
        body = json.loads(request.body.decode())
        query = body.get("query", "").strip()
    except:
        return HttpResponseBadRequest("Invalid JSON payload")
    static = rule_based_response(query)
    if static:
        return JsonResponse({"answer": static, "engine": "static"})
    try:
        answer = gemini_answer(query)
        answer = re.sub(r'[\*\`\[\]\(\)]', '', answer).strip()
        return JsonResponse({"answer": answer, "engine": "gemini"})
    except:
        pass
    try:
        answer = t5_respond(query)
        answer = re.sub(r'[\*\`\[\]\(\)]', '', answer).strip()
        return JsonResponse({"answer": answer, "engine": "t5"})
    except:
        return JsonResponse({"answer": "Sorry, I'm unable to answer right now.", "engine": "none"})
