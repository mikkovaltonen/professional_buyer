# AI Kysynnänennusteavustaja

AI-pohjainen työkalu kysynnän ennustamiseen ja varastonhallinnan optimointiin.

## Kuvaus
AI Kysynnänennusteavustaja on moderni web-sovellus, joka auttaa yrityksiä ennustamaan tuotteiden kysyntää erityisesti tilanteissa, joissa tilastollista dataa on vähän. Sovellus hyödyntää edistynyttä tekoälyä ja koneoppimista tarjotakseen tarkkoja ennusteita ja parantaakseen varastonhallintaa.

## Ominaisuudet

- 📊 Kysynnän analysointi ja visualisointi
- 📝 Päätösongelmien dokumentointi ja oppiminen
- 🔍 Automaattinen markkinasignaalien seuranta
- 💾 Ennustekorjausten tallennus ja hallinta
- 🔄 Integroitavissa olemassa oleviin järjestelmiin (tbd)
- 🔐 Turvallinen käyttäjienhallinta

## Teknologiat
- React + TypeScript
- Vite
- Tailwind CSS
- Shadcn/ui
- Gemini API
- Vercel (deployment)
- Firebase (backend services)

### Gemini API 
Kysyntä ennusteen tulkitsemisessa käytetään Gemini Pro mallia, joka tukee sekä kuvien analysointia että nettihakua kysynnän ennustamiseen.

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

### 6. Testaus
- Yksikkötestit komponenteille
- API-integraatiotestit
- Tyypintarkistus TypeScriptillä
- Testitiedostot löytyvät `tests/`-hakemistosta

### 7. Ennustekorjausten tallennus
- Tallenna ennustekorjaukset JSON-muodossa
- Validointi korjausdatan oikeellisuudelle
- Automaattinen tuoteryhmän liittäminen korjauksiin
- Selkeät virheilmoitukset virheellisestä datasta
- Korjausten tallennus paikalliseen tiedostoon
- Tuki useille korjauksille samassa tallennuksessa

## Käyttöönotto

### Vaatimukset
- Node.js
- npm/yarn/pnpm
- Gemini API -avain

### Asennus
1. Kloonaa repositorio
```bash
git clone https://github.com/your-org/ai-kysyntaennuste.git
```

2. Asenna riippuvuudet
```bash
npm install
```

3. Luo .env-tiedosto ja lisää tarvittavat ympäristömuuttujat
```env
VITE_GEMINI_API_KEY=xxx
```

4. Käynnistä kehityspalvelin
```bash
npm run dev
```

### Testaus
```bash
npm run test
```

### Tuotantoon vieminen
Sovellus on konfiguroitu käyttämään Vercel-palvelua tuotantoon viemiseen. Muutokset main-haaraan deployautuvat automaattisesti.

## Projektin rakenne
```
ai-kysyntaennuste/
├── public/              # Staattiset tiedostot
├── src/                # Lähdekoodi
│   ├── api/           # API-integraatiot
│   ├── components/    # React-komponentit
│   │   └── ui/       # UI-komponenttikirjasto
│   ├── hooks/        # React-hookit
│   ├── lib/          # Apukirjastot ja työkalut
│   ├── pages/        # Sivukomponentit
│   ├── types/        # TypeScript-tyypit
│   └── App.tsx       # Pääsovelluskomponentti
├── tests/            # Testitiedostot
├── docs/            # Dokumentaatio
└── config/          # Konfiguraatiotiedostot
```

## Turvallisuus
- Käyttäjienhallinta toteutettu turvallisesti
- API-avaimet suojattu ympäristömuuttujilla
- Virheenkäsittely toteutettu kaikille kriittisille toiminnoille
- Syötteiden validointi ja sanitointi

## Lisenssi
Kaikki tekijänoikeudet kuuluvat SCM Best Oy:lle

## Yhteystiedot
Lisätietoja ja tukea saat osoitteesta [https://wisestein.fi/yhteystiedot](https://wisestein.fi/yhteystiedot)

## Documentation

- See [docs/data-normalization.md](docs/data-normalization.md) for details on the data normalization layer and field mapping.
