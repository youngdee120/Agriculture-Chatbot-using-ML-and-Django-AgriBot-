# AgriBot: AI‑Powered Agriculture Assistant

## **Table of Contents**

1. [Project Overview](#project-overview)  
2. [Features](#features)  
3. [Tech Stack](#tech-stack)  
4. [Prerequisites](#prerequisites)  
5. [Installation & Setup](#installation--setup)  
6. [Configuration](#configuration)  
7. [Running the App](#running-the-app)  
8. [Usage](#usage)  
9. [Directory Structure](#directory-structure)  
10. [API Reference](#api-reference)  
11. [Contributing](#contributing)  
12. [License](#license)  

---

## Project Overview

AgriBot is a Django‑based web application designed to empower Kenyan farmers (and anyone interested in agriculture) with:

- **Real‑time weather & 15‑day forecasts**  
- **Interactive map** (powered by Leaflet)  
- **Smart agronomy chatbot** (backed by Google Gemini API & T5 fallback)  
- **Live marketplace data**: search commodity prices by county  

This single‑page interface gives users everything they need on one platform: weather guidance, crop‑specific advice via chat, and up‑to‑date market pricing.

---

## Features

- **Weather & Crop Recommendations**  
  - “Use my location” or manual city lookup  
  - Current conditions + 15‑day trend chart  
  - Simple crop suggestions based on forecasted conditions  

- **Interactive Map**  
  - Satellite & street views via Leaflet  
  - Clickable markers for weather stations (future work)  

- **AI Chatbot**  
  - **Rule‑based** static Q&A for common queries  
  - **Gemini (Google Generative Language API)** for dynamic chat  
  - **T5 fallback** for custom agriculture models  
  - Markdown‑style formatting & text‑to‑speech toggling  

- **Marketplace Prices**  
  - Live fetch from KilimoSTAT API (JSON/CSV fallback)  
  - Filter by commodity & county (or “All Counties”)  
  - Date‑sorted price table  

---

## Tech Stack

- **Backend**: Django 5.2.1  
- **Frontend**: HTML5 / CSS3 / Vanilla JavaScript  
- **Chatbot API**: Google Gemini (Generative Language API)  
- **ML Fallback**: Hugging Face Transformers (T5) + PyTorch  
- **Database**: SQLite (for user auth)  
- **Maps**: Leaflet.js  
- **Charting**: Chart.js  
- **Weather**: OpenWeatherMap API  
- **Market Data**: KilimoSTAT JSON/CSV endpoint  

---

## Prerequisites

- Python 3.10+  
- Pip  
- Node (optional, for front‑end tooling)  
- A Google Cloud API key with access to the Generative Language API  
- (Optional) GPU & CUDA drivers if using T5 locally  

---

## Installation & Setup

1. **Clone the repo**  
   ```bash
   git clone https://github.com/yourorg/agri-bot.git
   cd agri-bot

2. ** Create and activate a virtual environment**
   
       python -m venv venv
  
        # Windows
        venv\Scripts\activate
        
        # macOS/Linux
        source venv/bin/activate

4. ** Install dependencies**
   
       pip install --upgrade pip
       pip install -r requirements.txt
6. ** 🔐 Configuration**
    Create a .env file in the root folder with the following:
      SECRET_KEY=your_django_secret_key
      DEBUG=True
      
      OWM_API_KEY=your_openweathermap_api_key
      GEMINI_API_KEY=your_gemini_api_key
      
      T5_MODEL_DIR=chatbot/model/t5_agri_final
7. ** ▶️ Running the App**
   
       python manage.py migrate
       python manage.py createsuperuser
       python manage.py collectstatic --noinput

  # For PowerShell or Linux/macOS
  
        $env:GEMINI_API_KEY = "AIzaSyCVIrhLKiyGEvOb3qIDZkqMl7bAuHxgj30"
        python manage.py runserver

7. ** 🧑‍💻 Usage**
    🏠 Home Dashboard
    View weather, map, and crop charts
    
    Use "My Location" or manual city input
    
    📊 Marketplace
    Enter a commodity (e.g. "maize")
    
    Choose a county
    
    Click Search Prices
    
    💬 Chatbot
    Open via navbar
    
    Ask farming-related questions
    
    Enable/disable voice output
    
    Upload plant photos for context
8. ** 🗂 Directory Structure**
   
               agri-bot/
            ├── manage.py
            ├── .env
            ├── requirements.txt
            ├── agri_chatbot/           # Django project
            │   ├── settings.py
            │   ├── urls.py
            │   └── wsgi.py
            ├── chatbot/                # Main app
            │   ├── views.py
            │   ├── urls.py
            │   ├── templates/chatbot/
            │   │   ├── index.html
            │   │   └── chatbot.html
            │   ├── static/
            │   │   ├── css/
            │   │   ├── js/
            │   │   └── assets/
            │   └── model/              # T5 fallback model
            └── README.md
10. ** 📡 API Reference**
    GET /api/market_prices/?commodity=<>&county=<>
    Query Params:
    
    commodity (required): substring match, e.g. maize
    
    county (optional): e.g. nairobi
    
    Response:

         {
          "results": [
            {
              "date": "2025‑05‑13",
              "county": "Nairobi",
              "market": "Gikomba",
              "commodity": "Maize",
              "price": "2000"
            }
          ]
        }
11. ** 📄 License** 
    Let me know if you'd like:
    - badges (build, license, etc.)
    - screenshot/image integration
    - deployment instructions for platforms like Render, Vercel, or Heroku
   


