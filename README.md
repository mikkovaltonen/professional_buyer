# AI Kysynnänennustus Assistentti

Tekoälyavusteinen työkalu kysynnän ennustamiseen ja analysointiin.

## Ominaisuudet

- Interaktiivinen chat-käyttöliittymä kysynnän analysointiin
- GPT-4.1 tekoälymallin hyödyntäminen
- Responsiivinen ja moderni käyttöliittymä
- Yksinkertainen kirjautuminen

## OpenAI API Integraatio

```ascii
┌──────────────┐     ┌─────────┐     ┌──────────┐
│ Käyttäjä     │     │ Chat    │     │ OpenAI   │
│ Syöte        │────>│ API     │────>│ GPT-4.1  │
└──────────────┘     └─────────┘     └──────────┘
       ▲                  │                │
       │                  │                │
       └──────────────────┴────────────────┘
          Vastaus käyttöliittymään
```

Projekti käyttää OpenAI:n uutta responses API:a:
```javascript
const response = await client.responses.create({
    model: "gpt-4.1",
    input: "Käyttäjän syöte"
});
```

## Asennus ja Käyttöönotto

1. Kloonaa repositorio:
```bash
git clone https://github.com/wisestein/demand-forecast.git
```

2. Asenna riippuvuudet:
```bash
npm install
```

3. Luo .env tiedosto ja lisää OpenAI API avain:
```
VITE_OPENAI_API_KEY=your-api-key-here
```

4. Käynnistä kehityspalvelin:
```bash
npm run dev
```

Sovellus käynnistyy osoitteeseen http://localhost:8081

## Kirjautuminen

- Käyttäjätunnus: forecasting@kemppi.com
- Salasana: laatu

## Projektin Rakenne

Katso tarkempi dokumentaatio projektin rakenteesta [PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)

## Testaus

OpenAI API:n testaus:
```bash
npm run test:openai
```

## Teknologiat

- React + TypeScript
- Vite
- Tailwind CSS
- OpenAI API (responses API)
- Shadcn/ui