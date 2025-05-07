# Projektin rakenne

## Sivut
- `src/pages/Index.tsx` - Pääsivu ja kirjautumisnäkymä
- `src/pages/Workbench.tsx` - Työpöytänäkymä ennusteiden käsittelyyn

## Komponentit
- `src/components/LoginButton.tsx` - Kirjautumispainike
- `src/components/LoginForm.tsx` - Kirjautumislomake
- `src/components/ProtectedRoute.tsx` - Suojattu reitti kirjautuneille käyttäjille
- `src/components/ForecastContent.tsx` - Ennusteiden sisältö ja visualisointi
- `src/components/GeminiChat.tsx` - Chat-komponentti Gemini API:n kanssa
- `src/components/TimeChart.tsx` - Aikasarjakuvaaja
- `src/components/ApplyCorrectionsButton.tsx` - Ennustekorjausten tallennuspainike

## API
- `src/api/apply-corrections.ts` - Ennustekorjausten käsittely
- `src/api/save-csv.ts` - CSV-tiedostojen tallennus
- `src/api/save-json.ts` - JSON-tiedostojen tallennus

## Lib
- `src/lib/chartUtils.ts` - Kuvaajan apufunktiot
- `src/lib/dataService.ts` - Datan käsittelypalvelu
- `src/lib/firebase.ts` - Firebase-konfiguraatio
- `src/lib/chartService.ts` - Kuvaajan palvelu
- `src/lib/userService.ts` - Käyttäjähallinta
- `src/lib/env.ts` - Ympäristömuuttujat
- `src/lib/fileService.ts` - Tiedostojen käsittely
- `src/lib/utils.ts` - Yleiset apufunktiot

## Hooks
- `src/hooks/useAuth.ts` - Autentikaation hook
- `src/hooks/use-mobile.tsx` - Mobiiliresponsiivisuuden hook
- `src/hooks/use-toast.ts` - Ilmoitusten hook

## Tiedostorakenne
```
src/
├── api/           # API-integraatiot
├── components/    # React-komponentit
│   └── ui/       # UI-komponenttikirjasto
├── hooks/        # React-hookit
├── lib/          # Apukirjastot ja työkalut
├── pages/        # Sivukomponentit
└── types/        # TypeScript-tyypit
```

## Tärkeimmät toiminnallisuudet

### 1. Autentikaatio
- Kovakoodattu käyttäjätunnistus
- Suojatut reitit kirjautuneille käyttäjille
- Kirjautumislomake ja -painike

### 2. Ennusteiden käsittely
- Aikasarjakuvaaja ennusteiden visualisointiin
- Ennustekorjausten tallennus ja käsittely
- Datan validointi ja muunnos

### 3. Tiedostojen käsittely
- JSON-tiedostojen tallennus ja lataus
- CSV-tiedostojen käsittely
- Tiedostojen validointi

### 4. Käyttöliittymä
- Responsiivinen suunnittelu
- Moderni ja selkeä käyttöliittymä
- Ilmoitusten järjestelmä 