# AI Kysynnänennusteavustaja

AI-pohjainen työkalu kysynnän ennustamiseen ja varastonhallinnan optimointiin.

## Kuvaus
AI Kysynnänennusteavustaja on moderni web-sovellus, joka auttaa yrityksiä ennustamaan tuotteiden kysyntää erityisesti tilanteissa, joissa tilastollista dataa on vähän. Sovellus hyödyntää edistynyttä tekoälyä ja koneoppimista tarjotakseen tarkkoja ennusteita ja parantaakseen varastonhallintaa.

## Ominaisuudet

- 📊 Kysynnän analysointi ja visualisointi
- 📝 Päätösongelmien dokumentointi ja oppiminen
- 🔍 Automaattinen markkinasignaalien seuranta
- 💾 Ennustekorjausten tallennus ja hallinta
- 🔄 Integroitavissa olemassa oleviin järjestelmiin
- 🔐 Turvallinen käyttäjienhallinta
- 📈 Automaattinen kuvaajan päivitys korjausten tallennuksen jälkeen
- 🌐 Täysin suomenkielinen käyttöliittymä

## Teknologiat
- React + TypeScript
- Vite
- Tailwind CSS
- Shadcn/ui
- Gemini API
- Vercel (deployment)
- Firebase (backend services)

### Gemini API 
Kysyntä ennusteen tulkitsemisessa käytetään Gemini 2.5 Pro -mallia, joka tukee sekä kuvien analysointia että nettihakua kysynnän ennustamiseen.

## Toiminnalliset speksit

### 1. Käyttöliittymä
- Yksinkertainen ja selkeä käyttöliittymä
- Kovakoodattu käyttäjätunnistus
- Työpöytä (Workbench) näkymä ennusteiden käsittelyyn
- Responsiivinen suunnittelu

### 2. Ennustekorjausten hallinta
- Tallenna ennustekorjaukset JSON-muodossa
- Validointi korjausdatan oikeellisuudelle
- Automaattinen tuoteryhmän liittäminen korjauksiin
- Selkeät virheilmoitukset virheellisestä datasta
- Korjausten tallennus paikalliseen tiedostoon
- Tuki useille korjauksille samassa tallennuksessa
- Automaattinen kuvaajan päivitys tallennuksen jälkeen
- Korjausten selitykset näkyvät kuvaajan tooltipissä

### 3. Datan visualisointi
- Interaktiivinen aikasarjakuvaaja
- Toteutunut kysyntä (sininen viiva)
- Vanha ennuste (vihreä katkoviiva)
- Tilastollinen ennuste (oranssi katkoviiva)
- Korjattu ennuste (punainen viiva)
- Ennustevirhe (punainen katkoviiva)

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

### Tuotantoon vieminen
Sovellus on konfiguroitu käyttämään Vercel-palvelua tuotantoon viemiseen:

1. Linkitä projekti Verceliin:
```bash
vercel link
```

2. Vie sovellus tuotantoon:
```bash
vercel --prod --force
```

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
│   └── types/        # TypeScript-tyypit
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

## Datarakenne
Sovellus käsittelee seuraavia datakenttiä:

- `Quantity`: Toteutunut kysyntä (sininen viiva)
- `old_forecast`: Vanha ennuste (vihreä katkoviiva)
- `new_forecast`: Tilastollinen ennuste (oranssi katkoviiva)
- `new_forecast_manually_adjusted`: Korjattu ennuste (punainen viiva)
- `old_forecast_error`: Ennustevirhe (punainen katkoviiva)
- `correction_percent`: Korjausprosentti
- `explanation`: Korjauksen selitys (näkyy kuvaajan tooltipissä)
- `correction_timestamp`: Korjauksen aikaleima

## Visualisointi

### Kysynnän historia ja ennusteet
Sovellus näyttää kaksi erillistä graafia:

1. **Kysynnän historia ja ennusteet**
   - Toteutunut kysyntä (sininen viiva)
   - Vanha ennuste (vihreä katkoviiva)
   - Tilastollinen ennuste (oranssi katkoviiva)
   - Korjattu ennuste (punainen viiva)
   - Ennustevirhe (punainen katkoviiva)

2. **Ennustevirhe-analyysi**
   - Keskimääräinen absoluuttinen virhe (kpl) - sininen viiva
     - Lasketaan kaikille tuotteille, joilla on sekä toteutunut kysyntä että ennuste
     - Kaava: |toteutunut kysyntä - vanha ennuste|
   - Prosenttiosuus tuotteista, joilla virhe < 20% - oranssi katkoviiva
     - Mittaa kuinka suuri osa tuotteista on ennustettu hyvin
     - Arvo vaihtelee 0-100% välillä
   - Näyttää dataa viimeiseltä 36 kuukaudelta
   - Auttaa ennusteen tarkkuuden seurannassa ja ongelmakohtien tunnistamisessa

## Tietokanta ja API

### MariaDB-siirtymä
Sovellus on siirtymässä Google Firestoresta MariaDB-tietokantaan. Tämä siirtymä parantaa:
- Datan suorituskykyä
- Tietojen kestävyyttä
- Skaalautuvuutta
- Kustannustehokkuutta

MariaDB API:n tekniset tiedot löytyvät `docs/maria_db_api-specifications.md`-tiedostosta.
