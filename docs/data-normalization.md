# Datan normalisointi

Tämä dokumentti kuvaa, miten ulkoisesta datasta tulevat kentät normalisoidaan sovelluksen sisäiseen muotoon.

## Kenttien mappaus

| Ulkoinen kenttä | Sisäinen kenttä | Huomio |
|----------------|----------------|---------|
| `year_month`   | `Year_Month`   | Päivämäärä YYYY-MM-DD muodossa |
| `prodgroup`    | `Product Group` | Tuoteryhmän nimi |
| `prodcode`     | `Product code` | Tuotekoodi |
| `product_description` | `Product description` | Tuotteen kuvaus |
| `prod_class`   | `prod_class`   | Tuoteluokka |
| `qty`          | `Quantity`     | Toteutunut kysyntä |
| `new_forecast` | `new_forecast` | Tilastollinen ennuste |
| `new_forecast_adj` | `new_forecast_manually_adjusted` | Manuaalisesti korjattu ennuste |
| `old_forecast` | `old_forecast` | Vanha ennuste |
| `old_forecast_error` | `old_forecast_error` | Ennustevirhe |
| `correction_percent` | `correction_percent` | Korjausprosentti |
| `explanation`  | `explanation`  | Korjauksen selitys |
| `correction_timestamp` | `correction_timestamp` | Korjauksen aikaleima |
| `forecast_corrector` | `forecast_corrector` | Korjauksen tekijä |
| `last_manual_correction_date` | `last_manual_correction_date` | Viimeisin manuaalinen korjaus |

## Graafien datan käsittely

### Kysynnän historia ja ennusteet
- Näyttää kaikki kuukaudet, joissa on dataa
- Null-arvoja ei näytetä graafissa
- Korjattu ennuste näytetään vain jos kaikilla tuoteryhmillä on arvo
- Datan järjestys tapahtuu aikajärjestykseen

### Ennustevirhe-analyysi
- Näyttää viimeisimmät 36 kuukautta
- Suodattaa pois rivit, joissa sekä toteutunut kysyntä että ennuste ovat null/undefined/0
- Virheiden laskenta:
  - Keskiarvoinen absoluuttinen virhe (MAE) = |toteutunut kysyntä - vanha ennuste|
  - Prosenttiosuus tuotteista, joiden virhe on alle 20%
- Laskenta tehdään vain kun molemmat arvot ovat olemassa

## Datan normalisointi

Datan normalisointi tapahtuu `normalizeTimeSeriesData`-funktiossa, joka:
1. Muuntaa ulkoiset kentät sisäiseen muotoon
2. Käsittelee null- ja undefined-arvot
3. Varmistaa oikean datatyypin
4. Lisää puuttuvat kentät oletusarvoilla

## Graafien viivojen mappaus

### Kysynnän historia ja ennusteet
| Viiva | Nimi | Datakenttä | Laskenta |
|-------|------|------------|-----------|
| Sininen | Toteutunut kysyntä | `Quantity` | Suora arvo |
| Punainen | Vanha ennuste | `old_forecast` | Suora arvo |
| Vihreä | Tilastollinen ennuste | `new_forecast` | Suora arvo |
| Oranssi | Korjattu ennuste | `new_forecast_manually_adjusted` | Suora arvo |
| Harmaa | Ennustevirhe | `old_forecast_error` | Suora arvo |

### Ennustevirhe-analyysi
| Viiva | Nimi | Datakenttä | Laskenta |
|-------|------|------------|-----------|
| Sininen | Keskiarvoinen absoluuttinen virhe | `meanAbsError` | |toteutunut kysyntä - vanha ennuste| |
| Oranssi | Virhe alle 20% | `percentBelow20` | (rivit joilla virhe < 20%) / (kaikki rivit) * 100 |

## Datan päivitys

Jos datan rakenne muuttuu, päivitä:
1. Tämä mappaustaulukko
2. `normalizeTimeSeriesData`-funktio
3. Graafien viivojen mappaus
4. Testit 