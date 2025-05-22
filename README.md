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
- `Quantity`: Toteutunut kysyntä
- `old_forecast`: Vanha ennuste
- `new_forecast`: Uusi tilastollinen ennuste
- `new_forecast_manually_adjusted`: Manuaalisesti korjattu ennuste
- `old_forecast_error`: Ennustevirhe
- `correction_percent`: Korjausprosentti
- `explanation`: Korjauksen selitys
- `correction_timestamp`: Korjauksen aikaleima

## Visualisointi

Sovellus näyttää kaksi erillistä graafia:

### 1. Kysynnän historia ja ennusteet
- Näyttää kaikki kuukaudet, joissa on dataa valitulle tuotteelle/tuoteryhmälle/tuoteluokalle
- Sisältää seuraavat datapisteet:
  - Toteutunut kysyntä (sininen)
  - Vanha ennuste (punainen)
  - Tilastollinen ennuste (vihreä)
  - Korjattu ennuste (oranssi)
  - Ennustevirhe (harmaa)
- Null-arvoja ei näytetä graafissa
- Korjattu ennuste näytetään vain jos kaikilla tuoteryhmillä on arvo

### 2. Ennustevirhe-analyysi
- Näyttää viimeisimmät 36 kuukautta
- Sisältää kaksi metriikkaa:
  - Keskiarvoinen absoluuttinen virhe (MAE)
  - Prosenttiosuus tuotteista, joiden virhe on alle 20%
- Suodattaa pois rivit, joissa sekä toteutunut kysyntä että ennuste ovat null/undefined/0
- Virheiden laskenta tehdään vain kun molemmat arvot ovat olemassa
- Auttaa arvioimaan ennusteen tarkkuutta viime aikoina

## Tietokanta ja API

Sovellus on siirtynyt Google Firestoresta MariaDB:hen. Tämä siirtymä tuo mukanaan:
- Parempi datan suorituskyky
- Kestävämpi tietojen tallennus
- Skaalautuvampi ratkaisu
- Kustannustehokkaampi toteutus

Tekniset tiedot MariaDB API:sta löytyvät tiedostosta `docs/maria_db_api-specifications.md`.
