# REST API Documentation

## Base URL
```
https://scmbp.com/REST/v1/genaibase/kemppi_Kemppi_100_FG_sales_m_assistant_input_forecasts_separated
```

## Authentication
API requires Bearer token authentication:
```
Authorization: Bearer <YOUR_TOKEN_HERE>
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
    'Authorization' = 'Bearer <YOUR_TOKEN_HERE>'
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
Päivittää ennustedataa. API odottaa aina tuotekohtaisia korjauksia. Yksi POST-pyyntö voi sisältää yhden tuotekohtaisen korjauksen.
Päivitys kohdistuu tiettyyn `Year_Month`, `prodcode`, `prodgroup` ja `prod_class` -kombinaatioon.

**Frontendin rooli korjauksissa:**
- **Tason kääntäminen:** Jos käyttöliittymässä korjaus tehdään tuoteluokka- tai tuoteryhmätasolla, käyttöliittymän (`ForecastContent.tsx`) vastuulla on kääntää tämä prosentuaalinen muutos yksittäisiksi tuotekohtaisiksi korjauspyynnöiksi, jotka lähetetään API:lle.
- **Nollaennusteiden suodatus:** Käyttöliittymän (`ForecastContent.tsx`) tulee suodattaa pois ne tuotteet, joiden olemassa oleva ennuste (`new_forecast_manually_adjusted` tai `new_forecast`) kyseiselle kuukaudelle on nolla tai puuttuu. API ei sovella korjausprosenttia näihin tapauksiin, ja `DataService` ei lähetä korjausta tällaisille tuotteille.

#### Request Body Structure
Yksi pyyntö päivittää yhden tuote-kuukausi -parin ennustetta. Tämä vastaa `ForecastCorrection` rajapintaa, jota `DataService` käyttää.
```typescript
// DataService.applyCorrections lähettää tämän mukaisia JSON-objekteja API:lle.
interface ForecastCorrectionAPIPayload {
  Year_Month: string;             // Kuukausi (YYYY-MM), johon korjaus kohdistuu. Avain on "Year_Month".
  prod_class: string;             // Tuoteluokka
  prodgroup: string;              // Tuoteryhmä (koodi)
  prodcode: string;               // Tuotekoodi
  correction_percent: number;     // Korjausprosentti (esim. 10 tai -5)
  explanation: string;            // Korjauksen selitys
  forecast_corrector?: string;    // Korjauksen tekijä (esim. käyttäjätunnus tai sähköposti), vapaaehtoinen.
  correction_timestamp: string;   // Korjauksen aikaleima (ISO 8601), DataService generoi tämän.
}
```

#### Example Request (Single Product Correction)
```powershell
$headers = @{
    'Authorization' = 'Bearer <YOUR_TOKEN_HERE>'
    'Content-Type' = 'application/json'
}
$body = @{
    Year_Month = "2025-08" # Avain on "Year_Month"
    prod_class = "1104 LS-laitteet"
    prodgroup = "15307 X8 WIRE FEEDERS" # Tuoteryhmän koodi
    prodcode = "X8900501501"
    correction_percent = -2
    explanation = "Korjaus perustuu markkinatrendeihin"
    forecast_corrector = "forecasting@kemppi.com" # Vapaaehtoinen
    correction_timestamp = "2024-07-12T10:00:00.000Z" # DataService luo tämän automaattisesti
} | ConvertTo-Json

Invoke-RestMethod -Uri 'https://scmbp.com/REST/v1/genaibase/kemppi_Kemppi_100_FG_sales_m_assistant_input_forecasts_separated' -Headers $headers -Method Post -Body $body
```
Backend laskee `new_forecast_manually_adjusted` -arvon soveltamalla `correction_percent` tuotteen nykyiseen `new_forecast`-arvoon (tai `new_forecast_manually_adjusted`, jos se on jo olemassa ja ei-null). Jos olemassa oleva ennuste on nolla tai null, korjausta ei sovelleta tähän tuotteeseen.

## Huomioitavaa
1. Tietokannan riveillä ei ole uniikkia ID:tä/UUID:tä käytetyssä API-rajapinnassa. Päivitykset kohdistetaan `Year_Month`, `prodcode`, `prodgroup` ja `prod_class` perusteella.
2. Kaikki `ForecastCorrectionAPIPayload`-interfacen kentät (pl. `forecast_corrector`, joka on vapaaehtoinen) ovat pakollisia POST-pyynnössä onnistuneen päivityksen varmistamiseksi backendissä. `correction_timestamp` lisätään automaattisesti `DataService`:n toimesta.
3. Aikaleima (`Year_Month`) on merkkijono muodossa `YYYY-MM`.
5. Määrät (Quantity, forecasts) ovat desimaalilukuja
6. Virheet (old_forecast_error) lasketaan automaattisesti
