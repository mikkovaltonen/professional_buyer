# AI Kysynnänennusteavustaja

AI-pohjainen työkalu kysynnän ennustamiseen ja varastonhallinnan optimointiin.

## Kuvaus
AI Kysynnänennusteavustaja on moderni web-sovellus, joka auttaa yrityksiä ennustamaan tuotteiden kysyntää erityisesti tilanteissa, joissa tilastollista dataa on vähän. Sovellus hyödyntää edistynyttä tekoälyä ja koneoppimista tarjotakseen tarkkoja ennusteita ja parantaakseen varastonhallintaa.

## Ominaisuudet

- 📊 Kysynnän analysointi ja visualisointi
- 📝 Päätösongelmien dokumentointi ja oppiminen
- 🔍 Automaattinen markkinasignaalien seuranta
- 🔄 Integroitavissa olemassa oleviin järjestelmiin (tbd)

## Teknologiat
- React + TypeScript
- Vite
- Tailwind CSS
- Shadcn/ui
- Grok API

## Käyttöönotto

### Vaatimukset
- Node.js
- npm/yarn/pnpm
- Grok API -avain


### Asennus
1. Kloonaa repositorio
```bash
git clone [repositorion-url]
```

2. Asenna riippuvuudet
```bash
npm install
```

3. Luo .env.local-tiedosto ja lisää tarvittavat ympäristömuuttujat
```env
VITE_OPENAI_API_KEY=xxx
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
```

4. Käynnistä kehityspalvelin
```bash
npm run dev
```

## Projektin rakenne
```
ai-kysyntaennuste/
├── public/              # Staattiset tiedostot
│   └── logo.png        # Wisestein logo
├── src/                # Lähdekoodi
│   ├── components/     # React-komponentit
│   │   └── ui/        # UI-komponenttikirjasto
│   ├── pages/         # Sivukomponentit
│   ├── lib/           # Apukirjastot ja työkalut
│   └── App.tsx        # Pääsovelluskomponentti
└── README.md          # Projektin dokumentaatio
```

## Kehitys ja testaus
- Noudata yhtenäistä koodaustyyliä
- Testaa muutokset huolellisesti ennen tuotantoon vientiä
- Dokumentoi merkittävät muutokset

## Lisenssi
Kaikki tekijänoikeudet kuuluvat SCM Best Oy:lle

## Yhteystiedot
Lisätietoja ja tukea saat osoitteesta [https://wisestein.fi/yhteystiedot](https://wisestein.fi/yhteystiedot)
