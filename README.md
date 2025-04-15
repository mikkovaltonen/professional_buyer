# AI Kysynnänennusteavustaja

AI-pohjainen työkalu kysynnän ennustamiseen ja varastonhallinnan optimointiin.

## Kuvaus
AI Kysynnänennusteavustaja on moderni web-sovellus, joka auttaa yrityksiä ennustamaan tuotteiden kysyntää erityisesti tilanteissa, joissa tilastollista dataa on vähän. Sovellus hyödyntää edistynyttä tekoälyä ja koneoppimista tarjotakseen tarkkoja ennusteita ja parantaakseen varastonhallintaa.

## Ominaisuudet
- 🤖 Tekoälyavusteinen ennustaminen
- 📊 Kysynnän analysointi ja visualisointi
- 📝 Päätösongelmien dokumentointi ja oppiminen
- 🔍 Automaattinen markkinasignaalien seuranta
- 📈 Varastonhallinnan optimointi
- 🔄 Integroitavissa olemassa oleviin järjestelmiin

## Teknologiat
- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- OpenAI API

## Käyttöönotto

### Vaatimukset
- Node.js
- npm/yarn/pnpm
- OpenAI API -avain

### Asennus
1. Kloonaa repositorio
```bash
git clone [repositorion-url]
```

2. Asenna riippuvuudet
```bash
npm install
```

3. Luo `.env` tiedosto projektin juureen ja lisää seuraavat muuttujat
```env
VITE_OPENAI_API_KEY=xxx
```

4. Käynnistä kehityspalvelin
```bash
npm run dev
```