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

### Gemini 2.5 API 
Kysyntä ennusteen tulkitsemisessa käytetään Gemini 2.5 Pro mallia joka sekä tukitsee kuvat että tekee nettihaun kysyntää 

## Toiminnalliset speksit

### 1. Chat-ikkuna
- Tukee markdown-muotoilua viesteissä
- Hyperlinkit avautuvat uuteen välilehteen
- Listat näkyvät oikein muotoiltuina
- Teksti on paremmin muotoiltu yleisesti
- Viestit näkyvät eri väreillä käyttäjän ja bottiviestien välillä
- Viestit skrollautuvat automaattisesti alimpaan viestiin
- Latausindikaattori näkyy, kun botti vastaa

### 2. Kuvien käsittely
- Tuetut tiedostotyypit: PNG, JPG, JPEG
- Kuvat muunnetaan base64-muotoon lähetettäessä
- Kuvat näkyvät viestiketjussa
- Kuvien käsittely tapahtuu asynkronisesti

### 3. Nettihaku
- Tukee Google-hakuja tuotteista
- Haku tulokset näkyvät markdown-muodossa
- Linkit ovat klikattavia ja avautuvat uuteen välilehteen
- Haku tulokset sisältävät:
  - Viralliset tuotesivut
  - Jälleenmyyjien sivut
  - Tekniset tiedot
  - Uutiset ja markkinatiedot

### 4. Sessiohallinta
- Sessio alkaa tuotteen ja kuvan valinnalla
- Sessio pysyy aktiivisena, kunnes käyttäjä vaihtaa tuotetta
- Edellisen session tiedot tyhjennetään automaattisesti
- Sessio tietoja ei tallenneta pysyvästi

### 5. Virheenkäsittely
- Virheilmoitukset näkyvät käyttäjälle selkeästi
- API-virheet käsitellään asianmukaisesti
- Kuvan käsittelyvirheet ilmoitetaan käyttäjälle
- Nettihakuvirheet käsitellään ja ilmoitetaan

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
VITE_GEMINI_API_KEY=xxx
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

## Lisenssi
Kaikki tekijänoikeudet kuuluvat SCM Best Oy:lle

## Yhteystiedot
Lisätietoja ja tukea saat osoitteesta [https://wisestein.fi/yhteystiedot](https://wisestein.fi/yhteystiedot)
