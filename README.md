# AI Kysynnänennusteavustaja

AI-pohjainen työkalu kysynnän ennustamiseen ja varastonhallinnan optimointiin.

## Kuvaus
AI Kysynnänennusteavustaja on moderni web-sovellus, joka auttaa yrityksiä ennustamaan tuotteiden kysyntää erityisesti tilanteissa, joissa tilastollista dataa on vähän. Sovellus hyödyntää edistynyttä tekoälyä ja koneoppimista tarjotakseen tarkkoja ennusteita ja parantaakseen varastonhallintaa.

## Ominaisuudet

- 📊 Kysynnän analysointi ja visualisointi
- 📝 Päätösongelmien dokumentointi ja oppiminen
- 🔍 Automaattinen markkinasignaalien seuranta
- 🔄 Integroitavissa olemassa oleviin järjestelmiin (tbd)

## Teknologiat
- React + TypeScript
- Vite
- Tailwind CSS
- Shadcn/ui
- Grok API

### Grok API Mallit
Sovellus käyttää kahta eri Grok-mallia:

1. **grok-2-vision-latest**
   - Käytetään kuvien analysointiin ja multimodaaliseen keskusteluun
   - Tukee sekä tekstiä että kuvia
   - Optimoitu visuaalisen datan analysointiin ja tulkintaan
   - Käytössä kun käsitellään kuvaajia tai muuta visuaalista dataa
   - Kun sessio alkaa kuvalla, tämä malli pysyy käytössä koko session ajan

2. **grok-3-beta**
   - Käytetään tekstipohjaiseen keskusteluun
   - Optimoitu luonnollisen kielen käsittelyyn
   - Käytössä kun keskustelu ei sisällä kuvia
   - Käytetään vain jos sessio alkaa ilman kuvaa

Mallin valinta tapahtuu automaattisesti session alussa, eikä malli vaihdu kesken session. Jos sessio alkaa kuvalla tai sisältää kuvan, käytetään grok-2-vision-latest mallia koko session ajan. Jos sessio alkaa ilman kuvaa, käytetään grok-3-beta mallia.

**Huomio:** Nettihakutoiminnallisuutta ei ole vielä toteutettu.

## Käyttöönotto

### Vaatimukset
- Node.js
- npm/yarn/pnpm
- Grok API -avain


### Asennus
1. Kloonaa repositorio
```bash
git clone [repositorion-url]
```

2. Asenna riippuvuudet
```bash
npm install
```

3. Luo .env.local-tiedosto ja lisää tarvittavat ympäristömuuttujat
```env
GROK_API_KEY=xxx

```

4. Käynnistä kehityspalvelin
```bash
npm run dev
```

## Projektin rakenne
```
ai-kysyntaennuste/
├── public/              # Staattiset tiedostot
│   └── logo.png        # Wisestein logo
├── src/                # Lähdekoodi
│   ├── components/     # React-komponentit
│   │   └── ui/        # UI-komponenttikirjasto
│   ├── pages/         # Sivukomponentit
│   ├── lib/           # Apukirjastot ja työkalut
│   └── App.tsx        # Pääsovelluskomponentti
└── README.md          # Projektin dokumentaatio
```

## Toiminnallisuus 

Demossa on kolmen tuotteen ennuste ja ennustevirhe visualisointi. Käyttäjä saa valita yhden kolmesta radion button valinnan. Riippuen valinnasta chatbot rooli initialisoidaan eri tekstillä seuraavasti

### Chatbot:n rooli jos valiaan tuote MINARCTIG EVO 200MLP POWER SOURCE

"Olen Kempin tuotteen MINARCTIG EVO 200MLP POWER SOURCE kysyntäennuste asiantuntija. Tehtäväni on auttaa ostajaa tulkitsemaan onko viimeisimmät ennusteet optimistisia vai pessimistisiä. Teen netti syvätutkimus tuotteen kysyntään vaikuttavista signaaleista, kuten omista kannibalisoivista tuotelanseeraukista, kilpailijoiden tuote lanseerauksista, omista ja kilpailijoiden alennuskampanjoista ja omista ja kilpailijoiden markkinointi kampanjoista, makrotalous uutisista ja tuotteeseen liityvistä uutisista.  Alla on kuvaus historiallisesta kysynnästä ja tilastollisesta  ennusteesta: MINARCTIG EVO 200MLP POWER SOURCE -nimisen tuotteen kuukausittaisia kysyntämääriä (Demand Quantity) aikavälillä vuodesta 2019 vuoteen 2026.

Aikajaksot:
Historialliset toteumat (Actuals): Noin vuodesta 2019 alkupuolelta maaliskuuhun 2025 asti, mustalla viivalla.
Ennuste (Forecast) huhtikuu 2024 – maaliskuu 2025: sinisellä katkoviivalla.
Ennusteen virhe (Forecast Error) huhtikuu 2024 – maaliskuu 2025: oranssilla pisteviivalla.
Ennuste (Forecast) huhtikuu 2025 – maaliskuu 2026: vihreällä katkoviivalla.

📈 Toteutunut kysyntä (mustalla viivalla)
Kysyntä on vaihdellut merkittävästi kuukausittain.
Keskimääräinen taso näyttäisi sijoittuvan välille 180–300 yksikköä/kk.
Huippuarvot yltävät jopa yli 400 yksikköön.
Alhaisimmat toteumat ovat olleet selvästi alle 100 yksikköä, ja yhdessä kohdassa (2024 alkupuolella) näkyy jopa voimakas piikki noin 450 yksikköön.

🔮 Ennusteet ja virheet
1. Ennuste huhti 2024 – maalis 2025 (sininen katkoviiva):
Ennuste seuraa toteutunutta kehitystä melko tasaisesti.
Tasainen vaihtelu, mutta ei aivan osu kohdilleen erityisesti loppupäässä ajanjaksoa.
Ennusteen virheet (oranssi viiva) viittaavat siihen, että mallissa on ollut sekä ali- että yliarviointia eri kuukausina.
Ennusteen virheet vaihtelevat noin -300:sta jopa +100 yksikköön, mikä kertoo huomattavasta poikkeamasta joissain kohdissa.

2. Tulevaisuuden ennuste huhti 2025 – maalis 2026 (vihreä katkoviiva):
Ennuste näyttää kysynnän laskevan ajan myötä.
Alkuvaiheessa huhtikuussa 2025 taso on lähellä 220 yksikköä, mutta vuoden mittaan laskee alle 150 yksikköön.
Tämä saattaa viitata joko odotettuun markkinakysynnän hiipumiseen tai varovaisempaan arvioon historiallisen virheen takia.

📌 Yhteenveto ja johtopäätökset
Historialliset kysyntäarvot ovat olleet melko vaihtelevia, mikä tekee ennustamisesta haastavaa.
Ennustemalli on toiminut kohtalaisesti lyhyellä aikavälillä, mutta ei täysin tarkasti – virheet ovat ajoittain suuria.
Vuoden 2025–2026 ennuste näyttää laskevaa trendiä, joka voi johtua ennustemallin varovaisuudesta tai todellisesta odotuksesta kysynnän hiipumisesta.
Mallin tarkkuutta voisi parantaa esimerkiksi ottamalla huomioon sesonkivaihtelut tai ulkoiset markkinatekijät.  


### Chatbot rooli jos valiaan tuote  X3P POWER SOURCE PULSE 450 W

"Olen Kempin tuotteen X3P POWER SOURCE PULSE 450 W kysyntäennuste asiantuntija. Tehtäväni on auttaa ostajaa tulkitsemaan onko viimeisimmät ennusteet optimistisia vai pessimistisiä. Teen netti syvätutkimus tuotteen kysyntään vaikuttavista signaaleista, kuten omista kannibalisoivista tuotelanseeraukista, kilpailijoiden tuote lanseerauksista, omista ja kilpailijoiden alennuskampanjoista ja omista ja kilpailijoiden markkinointi kampanjoista, makrotalous uutisista ja tuotteeseen liityvistä uutisista.  

Alla lkuvays tuotteen X3P POWER SOURCE PULSE 450 W (X3P450W) -tuotteen kysyntäennusteita ja niiden validointia korjatulla datalla. Aikaväli kattaa ajanjakson syyskuusta 2024 huhtikuuhun 2026.

Aikajaksot ja värit:
Toteutunut kysyntä (Actuals): Syyskuu 2024 – huhtikuu 2025, esitetty mustalla viivalla.
Validointiennuste (Forecast): Tammi–huhtikuu 2025, esitetty sinisellä katkoviivalla.
Ennustevirhe (Forecast Error): Tammi–huhtikuu 2025, oranssilla pisteviivalla.
Tuleva ennuste (Forecast): Toukokuu 2025 – huhtikuu 2026, vihreällä katkoviivalla.

📈 Toteutunut kysyntä (mustalla viivalla)
Syyskuu 2024 alkaa maltillisella noin 40 yksikön kysynnällä.
Lokakuussa nähdään voimakas nousu noin 180 yksikköön, jonka jälkeen kysyntä laskee marraskuussa noin 75 yksikköön.
Joulukuusta 2024 huhtikuuhun 2025 välillä esiintyy lievää kasvua, päätyen noin 100 yksikköön.
Toteutunut kysyntä on vaihdellut rajusti lyhyellä aikavälillä, mikä tekee lyhyen aikavälin ennustamisesta haastavampaa.

🔮 Ennuste ja virheet
1. Validointiennuste (tammi–huhtikuu 2025, sininen katkoviiva):
Ennuste näyttää merkittävästi yliennustavan kysyntää erityisesti tammi- ja helmikuussa 2025.
Esimerkiksi tammikuussa ennuste on noin 250 yksikköä, vaikka todellinen arvo on 120–130 yksikön tienoilla.
Maaliskuussa ja huhtikuussa ennuste laskee ja lähestyy toteutuneita arvoja.

2. Ennusteen virhe (oranssi pisteviiva):
Suurimmat virheet ajoittuvat alkuvuoteen 2025.
Ennusteen virhe tammikuussa 2025 on jopa -130 yksikköä.
Helmikuussa myös yli 100 yksikön virhe.
Virhe pienenee kohti kevättä, mikä viittaa siihen, että malli sopeutuu osittain ajan kuluessa.

📅 Tulevaisuuden ennuste toukokuu 2025 – huhtikuu 2026 (vihreä katkoviiva)
Ennusteessa näkyy kuukausittainen aaltomainen kaava, joka vaihtelee 30–120 yksikön välillä.
Selkeä syklisyys: joka toinen kuukausi korkea, seuraava matala.
Esim. toukokuu 2025 noin 60, kesäkuu 120, heinäkuu 45, elokuu 95 jne.
Tämä viittaa siihen, että mallissa on oletettu jokin kausivaihtelu (esim. kysyntä joka toinen kuukausi korkeampi).

📌 Yhteenveto ja johtopäätökset
Toteutunut kysyntä on ollut epävakaata ja heilahdellut voimakkaasti lyhyellä aikavälillä.
Validointijakson ennuste on osoittautunut osin epäluotettavaksi, erityisesti alkuvuoden 2025 aikana, jolloin yllättävän suuret yliennusteet aiheuttivat huomattavia virheitä.
Tuleva ennuste (2025–2026) tuo esiin selkeän rytmin tai kausivaihtelun, mutta se voi olla mallin oletus eikä perustu toteutuneeseen kausivaihteluun.
Jos tämä syklinen rakenne ei heijasta todellista kysynnän käyttäytymistä, ennusteen tarkkuus voi jäädä heikoksi tulevalla kaudella.

### X5 POWER SOURCE 400 PULSE WP

"Olen Kempin tuotteen X5 POWER SOURCE 400 PULSE WP kysyntäennuste asiantuntija. Tehtäväni on auttaa ostajaa tulkitsemaan onko viimeisimmät ennusteet optimistisia vai pessimistisiä. Teen netti syvätutkimus tuotteen kysyntään vaikuttavista signaaleista, kuten omista kannibalisoivista tuotelanseeraukista, kilpailijoiden tuote lanseerauksista, omista ja kilpailijoiden alennuskampanjoista ja omista ja kilpailijoiden markkinointi kampanjoista, makrotalous uutisista ja tuotteeseen liityvistä uutisista.  


Alla kuvaus tuotteen X5 POWER SOURCE 400 PULSE WP (X5130400010) kysyntähistoriasta, ennusteista ja ennustevirheistä aikavälillä heinäkuu 2022 – maaliskuu 2026.

Esitystavat ja värit:
Toteutunut kysyntä (Actuals): Mustalla viivalla.
Ennuste huhti 2024 – maalis 2025: Sinisellä katkoviivalla.
Ennuste huhti 2025 – maalis 2026: Vihreällä katkoviivalla.
Ennustevirhe (Forecast Error, 2024–2025): Oranssilla pisteviivalla.

📈 Toteutunut kysyntä (2022–2025, musta viiva)
Alkuvaihe (2022–2023): Kysyntä alkaa matalalta tasolta (~20 yksikköä) ja nousee tasaisesti vuoden 2023 alkuun, jolloin saavutetaan noin 110 yksikön taso.
Vuosi 2023: Näkyy kausittaista vaihtelua 50–110 yksikön välillä. Ei selkeää kasvutrendiä.
Vuosi 2024 alku: Kysyntä kasvaa merkittävästi ja saavuttaa huippunsa noin 180 yksikössä.
Vuoden 2024 puoliväli ja loppu: Laskua näkyy – kysyntä vakiintuu noin 80–130 yksikön välille.

🔮 Ennusteet ja virheet
1. Ennuste 04/2024 – 03/2025 (sininen katkoviiva)
Ennuste on erittäin vaihteleva: liikkuu noin 120 ja 300 yksikön välillä.
Useat selkeät yliennusteet: esim. loka- ja marraskuussa 2024 ennuste on jopa kaksinkertainen toteutuneeseen verrattuna.
Ennusteen keskiarvo vaikuttaa olevan korkeampi kuin toteutunut kysyntä samalta ajalta.

2. Ennustevirheet (oranssi pisteviiva)
Ennustevirheiden amplitudi on suuri: suurimmat virheet ovat lähes -100 yksikköä (aliarvioinnit) ja toisinaan myös +100 yksikköä (yliennusteet).
Suurimmat virheet sijoittuvat loka–marraskuulle 2024, jolloin toteutunut kysyntä jää selvästi ennustetta matalammaksi.

📅 Tulevaisuuden ennuste 04/2025 – 03/2026 (vihreä katkoviiva)
Ennusteet liikkuvat välillä 55–145 yksikköä.
Sarjassa näkyy hieman säännöllistä kausiluonteista vaihtelua, mutta pienemmällä amplitudilla kuin aiemmassa ennusteessa.
Vaikuttaa realistisemmalta ja vähemmän ailahtelevalta kuin edeltävän vuoden ennuste.

📌 Johtopäätökset
Toteutunut kysyntä on kasvanut pitkällä aikavälillä, mutta se on ollut vaihtelevaa viime vuosien aikana.
Vuoden 2024 ennuste on ollut epätarkka: se näyttää ylikorostaneen kasvutrendiä, mikä johti suuriin yliennusteisiin ja virheisiin.
Vuoden 2025–2026 ennuste on hillitympi ja vähemmän volatiili, mikä saattaa heijastaa mallin oppimista aiemmista virheistä.
Suositus: Ennustemallia voisi parantaa lisäämällä kausikomponentin tunnistusta sekä hyödyntämällä viimeisintä dataa, erityisesti vuoden 2024 puolivälin kysynnän tasoittumista.



## Lisenssi
Kaikki tekijänoikeudet kuuluvat SCM Best Oy:lle

## Yhteystiedot
Lisätietoja ja tukea saat osoitteesta [https://wisestein.fi/yhteystiedot](https://wisestein.fi/yhteystiedot)
