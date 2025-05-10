# Data Normalization Layer

## Purpose
The data normalization layer decouples external data source field names from the internal application logic. It ensures that any incoming data format is converted to the canonical `TimeSeriesData` interface used throughout the app.

## Why Normalize?
- Supports multiple or legacy data formats.
- Centralizes mapping logic for easier maintenance.
- Reduces risk of breaking the app when data sources change.

## Field Mapping Table
| External Field         | Internal Field                  | Notes |
|-----------------------|--------------------------------|-------|
| `year_month`          | `Year_Month`                   |       |
| `prodgroup`           | `Product Group`                |       |
| `prodcode`            | `Product code`                 |       |
| `product_description` | `Product description`          |       |
| `qty`                 | `Quantity`                     |       |
| `new_forecast`        | `new_forecast`                 | Maps to orange dotted "Uusi ennuste" line in chart |
| `new_forecast_adj`    | `new_forecast_manually_adjusted`| Maps to red "Korjattu ennuste" line in chart |
| `old_forecast`        | `old_forecast`                 | Maps to green dotted "Vanha ennuste" line in chart |
| `old_forecast_error`  | `old_forecast_error`          | Maps to red dotted "Ennustevirhe" line in chart |
| `correction_percent`  | `correction_percent`          | Percentage adjustment for manual corrections |
| `explanation`         | `explanation`                 | Text explanation for manual corrections |
| `correction_timestamp`| `correction_timestamp`        | When the correction was made |

## Chart Line Mappings

### Kysynnän historia ja ennusteet
| Line Color | Line Name | Data Field |
|------------|-----------|------------|
| Blue (#4338ca) | Toteutunut | `Quantity` |
| Green dotted (#10b981) | Vanha ennuste | `old_forecast` |
| Orange dotted (#f59e0b) | Uusi ennuste | `new_forecast` |
| Red (#dc2626) | Korjattu ennuste | `new_forecast_manually_adjusted` |
| Red dotted (#ef4444) | Ennustevirhe | `old_forecast_error` |

### Ennustevirhe-analyysi
| Line Color | Line Name | Data Field | Calculation |
|------------|-----------|------------|-------------|
| Blue (#2563eb) | Keskim. abs. virhe | `meanAbsError` | Average of |actual - forecast| for all products |
| Orange dotted (#f59e0b) | % alle 20% virhe | `percentBelow20` | Percentage of products with error < 20% |

#### Ennustevirheen laskenta
1. **Keskimääräinen absoluuttinen virhe**
   - Lasketaan kaikille tuotteille, joilla on sekä toteutunut kysyntä että ennuste
   - Kaava: |toteutunut kysyntä - vanha ennuste|
   - Näytetään yksiköissä (kpl)
   - Auttaa tunnistamaan ennusteen tarkkuuden kehitystä

2. **Prosenttiosuus tuotteista, joilla virhe < 20%**
   - Lasketaan kuinka suuri osa tuotteista on ennustettu hyvin
   - Hyvä ennuste = virhe < 20% toteutuneesta kysynnästä
   - Arvo vaihtelee 0-100% välillä
   - Auttaa arvioimaan ennustemallin kokonaistarkkuutta

## How to Update the Mapping
1. Edit the normalization function in `src/lib/dataService.ts` (see `normalizeTimeSeriesData`).
2. Update the mapping table above to reflect any changes.
3. Add or update unit tests for new or changed fields.

## Example Usage
When loading data, the app will call the normalization function to ensure all data matches the `TimeSeriesData` interface, regardless of the original field names. 