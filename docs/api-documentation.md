# API-dokumentaatio

## Yleiskatsaus

Tämä dokumentaatio kuvaa ennustejärjestelmän API-endpointit sekä niiden teknisen että funktionaalisen toteutuksen. API on siirtymässä Google Firestoresta MariaDB-tietokantaan. Tämä siirtymä on käynnissä ja dokumentaatio kuvaa molemmat toteutukset.

## Tietokantasiirtymä

### Nykyinen tila (Firestore)
- API on toteutettu Vite-palvelimen middleware-tasolla
- Datan tallennus tapahtuu Firestore-tietokantaan
- Kehitysympäristössä käytetään muistissa olevaa dataa

### Siirtymävaihe (MariaDB)
- API siirtyy MariaDB-tietokantaan
- Tarkemmat tekniset tiedot löytyvät `docs/maria_db_api-specifications.md`
- Siirtymä tapahtuu vaiheittain, jotta järjestelmän toiminta säilyy keskeytyksettä

## API Endpointit

### 1. Ennustedatan hakeminen
```http
GET /api/forecast-data
```

#### Tekninen toteutus
- Endpoint on toteutettu Vite-palvelimen middleware-tasolla
- Palauttaa muistissa olevan ennustedatan JSON-muodossa
- Sisältää CORS-headerit

#### Vastaus
```json
[
  {
    "date": "2024-03-01",
    "quantity": 100.5,
    "old_forecast": 95.0,
    "new_forecast": 98.2,
    "new_forecast_manually_adjusted": 98.2,
    "old_forecast_error": 0,
    "correction_percent": 3.2,
    "explanation": "Adjusted based on market trends",
    "correction_timestamp": "2024-03-15T10:00:00Z"
  }
]
```

### 2. Ennustedatan tallentaminen
```http
POST /api/forecast-data
```

#### Tekninen toteutus
- Hyväksyy JSON-muotoisen datan
- Validoi syötteen olevan taulukko
- Tallentaa datan muistiin
- Sisältää virheenkäsittelyn

#### Pyyntö
```json
[
  {
    "date": "2024-03-01",
    "quantity": 100.5,
    "old_forecast": 95.0,
    "new_forecast": 98.2,
    "new_forecast_manually_adjusted": 98.2,
    "old_forecast_error": 0,
    "correction_percent": 3.2,
    "explanation": "Adjusted based on market trends",
    "correction_timestamp": "2024-03-15T10:00:00Z"
  }
]
```

#### Vastaus
```json
{
  "success": true
}
```

### 3. Ennustekorjausten tallentaminen
```http
POST /api/save-forecast
```

#### Tekninen toteutus
- Hyväksyy JSON-muotoisen korjausdatan
- Validoi syötteen sisältävän adjustments-taulukon
- Tallentaa korjaukset muistiin aikaleimalla
- Sisältää virheenkäsittelyn ja lokituksen

#### Pyyntö
```json
{
  "adjustments": [
    {
      "date": "2024-03-01",
      "new_forecast_manually_adjusted": 98.2,
      "correction_percent": 3.2,
      "explanation": "Adjusted based on market trends",
      "correction_timestamp": "2024-03-15T10:00:00Z"
    }
  ]
}
```

#### Vastaus
```json
{
  "success": true
}
```

### 4. Ennustekorjausten hakeminen
```http
GET /api/forecast-adjustments
```

#### Tekninen toteutus
- Palauttaa muistissa olevat korjaukset ja niiden aikaleiman
- Sisältää CORS-headerit

#### Vastaus
```json
{
  "adjustments": [
    {
      "date": "2024-03-01",
      "new_forecast_manually_adjusted": 98.2,
      "correction_percent": 3.2,
      "explanation": "Adjusted based on market trends",
      "correction_timestamp": "2024-03-15T10:00:00Z"
    }
  ],
  "timestamp": "2024-03-15T10:00:00Z"
}
```

## Datarakenteet

### TimeSeriesData
```typescript
interface TimeSeriesData {
  date: string;                    // Päivämäärä YYYY-MM-DD muodossa
  quantity: number;                // Todellinen määrä
  old_forecast: number;            // Vanha ennuste
  new_forecast: number;            // Uusi ennuste
  new_forecast_manually_adjusted: number;  // Manuaalisesti korjattu ennuste
  old_forecast_error: number;      // Ennustevirhe
  correction_percent: number;      // Korjausprosentti
  explanation: string;             // Selitys korjaukselle
  correction_timestamp: string;    // Korjauksen aikaleima
}
```

### CorrectionData
```typescript
interface CorrectionData {
  date: string;                    // Päivämäärä YYYY-MM-DD muodossa
  new_forecast_manually_adjusted: number;  // Manuaalisesti korjattu ennuste
  correction_percent: number;      // Korjausprosentti
  explanation: string;             // Selitys korjaukselle
  correction_timestamp: string;    // Korjauksen aikaleima
}
```

## Virheenkäsittely

### HTTP-vastauskoodit
- 200: Onnistunut pyyntö
- 400: Virheellinen pyyntö
- 500: Palvelimen virhe

### Virheiden muoto
```json
{
  "error": "Virheilmoitus",
  "details": "Yksityiskohtainen virheilmoitus"
}
```

### Validointi
- Tarkistaa syötteiden oikeellisuuden
- Validoi datatyypit
- Tarkistaa pakolliset kentät
- Validoi päivämäärien muodon

## CORS-määrittelyt
Kaikki endpointit sisältävät seuraavat CORS-headerit:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

## Kehitysympäristö vs. Tuotanto
- Kehitysympäristössä data tallennetaan muistiin
- Tuotantoympäristössä käytetään MariaDB-tietokantaa
- Tuotantoympäristön API-määrittelyt löytyvät `docs/maria_db_api-specifications.md`

## Esimerkkejä käytöstä

### Ennustedatan hakeminen
```typescript
// Firestore (nykyinen)
const response = await fetch('/api/forecast-data');
const data = await response.json();

// MariaDB (tuleva)
const response = await fetch('/api/forecast', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
```

### Ennustekorjausten tallentaminen
```typescript
// Firestore (nykyinen)
const response = await fetch('/api/save-forecast', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    adjustments: [
      {
        date: "2024-03-01",
        new_forecast_manually_adjusted: 98.2,
        correction_percent: 3.2,
        explanation: "Adjusted based on market trends",
        correction_timestamp: new Date().toISOString()
      }
    ]
  })
});

// MariaDB (tuleva)
const response = await fetch('/api/forecast', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    Year_Month: "2024-03-01",
    "Product code": "PROD_001",
    new_forecast_manually_adjusted: 98.2,
    correction_percent: 3.2,
    explanation: "Adjusted based on market trends",
    correction_timestamp: new Date().toISOString()
  })
});
```
