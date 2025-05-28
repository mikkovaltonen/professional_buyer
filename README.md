# Professional Buyer

## Asennus

1. Luo virtuaaliympäristö:
```powershell
python -m venv venv
```

2. Aktivoi virtuaaliympäristö:
```powershell
.\venv\Scripts\activate
```

3. Asenna riippuvuudet:
```powershell
pip install -r requirements.txt
```

## Ympäristömuuttujat

Luo `.env` tiedosto projektin juureen ja lisää seuraavat muuttujat:
```
OPENAI_API_KEY="your_openai_api_key_here"
```

## Käynnistys

Käynnistä sovellus:
```powershell
python agents_and_tools.py
```

## Riippuvuudet

Sovellus käyttää seuraavia pääkomponentteja:
- openai==1.78.1
- openai-agents==0.0.14
- python-dotenv==1.1.0
- uvicorn==0.34.2
- starlette==0.46.2

Koko listan riippuvuuksista löydät requirements.txt tiedostosta. 