# API Documentation

## Ennustekorjausten API

### Tallenna ennustekorjaukset

**Endpoint:** `/api/apply-corrections`

**Metodi:** POST

**Kuvaus:**
Tallentaa manuaaliset korjaukset ennusteisiin. Korjaukset voidaan tehdä tuoteluokka-, tuoteryhmä- tai tuotetasolla.

**Pyynnön rakenne:**
```json
{
  "corrections": [
    {
      "product_group": "string",  // Tuoteryhmän koodi (pakollinen tuoteryhmätasolla)
      "product_code": "string",   // Tuotekoodi (pakollinen tuotetasolla)
      "month": "YYYY-MM",        // Korjattava kuukausi (pakollinen)
      "correction_percent": number, // Korjausprosentti (pakollinen)
      "explanation": "string"     // Korjauksen selitys (pakollinen)
    }
  ]
}
```

**Vastaus:**
```json
{
  "message": "string",  // Viesti onnistumisesta tai virheestä
  "updatedCount": number, // Päivitettyjen ennusteiden määrä
  "skippedCount": number  // Ohitettujen ennusteiden määrä
}
```

**Virhekoodit:**
- 400: Virheellinen pyyntö (esim. puuttuvia pakollisia kenttiä)
- 405: Virheellinen HTTP-metodi
- 500: Palvelimen virhe

**Esimerkkejä:**

1. Tuoteryhmän korjaus:
```json
{
  "corrections": [
    {
      "product_group": "10905 ACDC THREE-PHASE",
      "month": "2025-08",
      "correction_percent": -2,
      "explanation": "Talouden elpymisen odotetaan jatkuvan tasaisemmin"
    }
  ]
}
```

2. Tuotteen korjaus:
```json
{
  "corrections": [
    {
      "product_code": "10905-001",
      "month": "2025-08",
      "correction_percent": -2,
      "explanation": "Tuotteen kysyntä laskee odotettua hitaammin"
    }
  ]
}
```

### Tietorakenteet

#### ForecastCorrection
```typescript
interface ForecastCorrection {
  product_group?: string;    // Tuoteryhmän koodi (pakollinen tuoteryhmätasolla)
  product_code?: string;     // Tuotekoodi (pakollinen tuotetasolla)
  month: string;            // Korjattava kuukausi (YYYY-MM)
  correction_percent: number; // Korjausprosentti
  explanation: string;      // Korjauksen selitys
}
```

#### CsvRow
```typescript
interface CsvRow {
  Year_Month: string;
  'Product Group': string;
  'Product code': string;
  'Product description': string;
  Quantity: string;
  forecast_12m: string;
  old_forecast: string;
  old_forecast_error: string;
  correction_percent?: string;
  explanation?: string;
}
```

### Huomioitavaa

1. **Validointi:**
   - Korjausprosentin tulee olla välillä -100 ja 100
   - Kuukauden tulee olla muodossa YYYY-MM
   - Selityksen tulee olla vähintään 10 merkkiä pitkä

2. **Tietojen päivitys:**
   - Korjaukset päivittävät sekä Firestore-tietokannan että paikallisen datan
   - Päivitykset tehdään batch-operaationa varmistaen tietojen yhtenäisyys
   - Korjaukset näkyvät automaattisesti kuvaajassa

3. **Virheenkäsittely:**
   - Virheelliset korjaukset ohitetaan ja ilmoitetaan käyttäjälle
   - Tietokantavirheet käsitellään asianmukaisesti
   - Käyttäjälle näytetään selkeät virheilmoitukset

4. **Suorituskyky:**
   - Korjaukset käsitellään batch-operaationa optimoidakseen suorituskykyä
   - Tietokantakyselyt minimoidaan käyttämällä tehokkaita indeksejä
   - Paikallinen data päivitetään optimistisesti 