# API-dokumentaatio

## Tiedostojen käsittely

### apply-corrections.ts
Käsittelee ennustekorjaukset.

```typescript
export async function applyCorrections(corrections: CorrectionData[]): Promise<void>
```

#### Parametrit
- `corrections`: CorrectionData[] - Korjausdata

#### Palautusarvo
- `Promise<void>`

#### Virheet
- `Error`: Jos korjaukset ovat virheellisiä
- `Error`: Jos käsittely epäonnistuu

## Datarakenteet

### TimeSeriesData
```typescript
interface TimeSeriesData {
  date: string;
  quantity: number;
  old_forecast: number;
  new_forecast: number;
  new_forecast_manually_adjusted: number;
  old_forecast_error: number;
  correction_percent: number;
  explanation: string;
  correction_timestamp: string;
}
```

### CorrectionData
```typescript
interface CorrectionData {
  date: string;
  new_forecast_manually_adjusted: number;
  correction_percent: number;
  explanation: string;
  correction_timestamp: string;
}
```

## Virheenkäsittely

### Tiedostojen käsittely
- Tarkista tiedoston olemassaolo
- Validoi tiedoston muoto
- Käsittele lukuvirheet
- Ilmoita virheet käyttäjälle

### Datan validointi
- Tarkista pakolliset kentät
- Validoi datatyypit
- Tarkista päivämäärien muoto
- Ilmoita virheet käyttäjälle

### API-virheet
- Käsittele verkkoyhteyden virheet
- Ilmoita API-virheet käyttäjälle
- Yritä uudelleen tarvittaessa 