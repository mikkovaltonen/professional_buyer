# REST API Documentation

## Base URL
```
https://scmbp.com/REST/v1/genaibase/kemppi_Kemppi_100_FG_sales_m_assistant_input_forecasts_separated
```

## Authentication
API requires Bearer token authentication:
```
Authorization: Bearer fm91Lp8IhmZfIAFhwmx2Gb2fhDJZmsV4XaRDPse5zWfwYpURMcKJI7kS7QLbiiU5
```

## Data Structure

### TimeSeriesData Interface
```typescript
interface TimeSeriesData {
  Year_Month: string;                    // Aikaleima (YYYY-MM)
  prod_class: string;                    // Tuoteluokka
  prodgroup: string;                     // Tuoteryhmä
  prodcode: string;                      // Tuotekoodi
  proddesc1: string;                     // Tuotteen kuvaus
  Quantity: number | null;               // Toteutunut määrä
  new_forecast: number | null;           // Uusi ennuste
  old_forecast: number | null;           // Vanha ennuste
  old_forecast_error: number | null;     // Vanha ennustevirhe
  correction_percent: number | null;     // Korjausprosentti
  explanation: string | null;            // Korjauksen selitys
  new_forecast_manually_adjusted: number | null;  // Manuaalisesti korjattu ennuste
  correction_timestamp: string | null;   // Korjauksen aikaleima
}
```

## Endpoints

### GET / - Hae data
Hakee ennustedataa. Tukee WHERE-ehtoja rajaamaan hakutuloksia.

#### Query Parameters
- `where[field]=value` - Rajaa tuloksia kentän arvon perusteella
  - Esim. `where[prodcode]=3119770` hakee vain tietyn tuotekoodin tiedot

#### Example Request
```powershell
$headers = @{
    'Authorization' = 'Bearer fm91Lp8IhmZfIAFhwmx2Gb2fhDJZmsV4XaRDPse5zWfwYpURMcKJI7kS7QLbiiU5'
}
Invoke-RestMethod -Uri 'https://scmbp.com/REST/v1/genaibase/kemppi_Kemppi_100_FG_sales_m_assistant_input_forecasts_separated?where[prodcode]=3119770' -Headers $headers -Method Get
```

#### Example Response
```json
[
  {
    "Year_Month": "2024-04",
    "prod_class": "1104 LS-laitteet",
    "prodgroup": "15307 X8 WIRE FEEDERS",
    "prodcode": "X8900501501",
    "proddesc1": "X8 SUPERSNAKE GT02XW 15M CHILI",
    "Quantity": 0,
    "new_forecast": null,
    "old_forecast": 0.0649,
    "old_forecast_error": -0.0649,
    "correction_percent": null,
    "explanation": null,
    "new_forecast_manually_adjusted": null,
    "correction_timestamp": null
  }
]
```

### POST / - Päivitä data
Päivittää ennustedataa. Päivitykset tehdään WHERE-ehtojen perusteella.

#### Request Body
```typescript
interface ForecastCorrection {
  product_group?: string;    // Tuoteryhmä
  product_code?: string;     // Tuotekoodi
  month: string;             // Kuukausi (YYYY-MM)
  correction_percent: number; // Korjausprosentti
  explanation: string;       // Korjauksen selitys
  forecast_corrector?: string; // Korjauksen tehnyt henkilö
  prod_class?: string;       // Tuoteluokka
}
```

#### Example Request
```powershell
$headers = @{
    'Authorization' = 'Bearer fm91Lp8IhmZfIAFhwmx2Gb2fhDJZmsV4XaRDPse5zWfwYpURMcKJI7kS7QLbiiU5'
    'Content-Type' = 'application/json'
}
$body = @{
    prod_class = "1104 LS-laitteet"
    product_group = "15307 X8 WIRE FEEDERS"
    product_code = "X8900501501"
    month = "2025-08"
    correction_percent = -2
    explanation = "Korjaus perustuu markkinatrendeihin"
    forecast_corrector = "forecasting@kemppi.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri 'https://scmbp.com/REST/v1/genaibase/kemppi_Kemppi_100_FG_sales_m_assistant_input_forecasts_separated' -Headers $headers -Method Post -Body $body
```

## Huomioitavaa
1. Tietokannan riveillä ei ole uniikkia ID:tä/UUID:tä
2. Päivitykset tehdään WHERE-ehtojen perusteella
3. Kaikki kentät eivät ole pakollisia päivityksessä
4. Aikaleima (Year_Month) on muodossa YYYY-MM
5. Määrät (Quantity, forecasts) ovat desimaalilukuja
6. Virheet (old_forecast_error) lasketaan automaattisesti
