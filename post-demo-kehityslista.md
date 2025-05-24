# Post-Demo Kehityslista ja Huomiot

Tämä dokumentti listaa Kysyntäennusteavustaja-demon kehityskohteita, tunnistettuja puutteita ja mahdollisia parannusideoita demon jälkeistä jatkokehitystä varten.

## 1. Tietoturva

*   **Firestore-säännöt (`userPrompts`-kokoelma):**
    *   **Nykyinen tila:** Säännöt on asetettu erittäin salliviksi (`allow read, write: if true;`) testausta varten, jotta päästiin yli `Missing or insufficient permissions` -virheestä.
    *   **Suositus:** Tätä ei suositella tuotantokäyttöön.
        *   **Minimitaso:** Päivitä säännöt vaatimaan vähintään autentikointi: `allow read, write: if request.auth != null;`. Tämä estää autentikoimattomia käyttäjiä pääsemästä käsiksi prompt-tietoihin.
        *   **Ideaalitaso:** Toteuta käyttäjäkohtainen pääsynhallinta, jossa käyttäjä voi lukea ja kirjoittaa vain omiin prompt-dokumentteihinsa. Esimerkiksi: `allow read, write: if request.auth != null && request.auth.token.email == userId;` (missä `userId` on dokumentin tunniste, eli käyttäjän sähköposti). Tämä vaatii huolellista testausta varmistaakseen, että koodin käyttämä `userId` ja `request.auth.token.email` täsmäävät (esim. kirjainkoko).
*   **Muut kokoelmat:** Jos projektiin lisätään muita Firestore-kokoelmia, niille tulee määritellä asianmukaiset ja turvalliset säännöt alusta alkaen. Vältä liian sallivia yleissääntöjä.
*   **Palvelutilien käyttö:** Varmista, että palvelutilien avaimia ei koskaan upoteta client-puolen koodiin. Niitä tulee käyttää vain turvallisissa taustaympäristöissä.

## 2. Käyttäjäkokemus ja Käyttöliittymä (UI/UX)

*   **Lataustilojen käsittely:**
    *   Yhdenmukaista latausindikaattoreiden käyttöä (`PromptEditor.tsx`, `GeminiChat.tsx`, mahdolliset muut datalataukset). Käyttäjälle tulisi olla selvää, milloin dataa ladataan.
*   **Virheilmoitukset:**
    *   Paranna virheilmoitusten näyttämistä käyttäjälle. Esimerkiksi, jos promptin tallennus tai lataus epäonnistuu muusta syystä kuin oikeusongelmista, käyttäjälle tulisi näyttää ymmärrettävä ilmoitus (esim. käyttäen `toast`-komponenttia).
*   **Saavutettavuus:**
    *   `DialogContent`-komponentin kuvaus lisättiin (`DialogDescription`), mikä on hyvä. Jatka saavutettavuuskäytäntöjen noudattamista uusissa komponenteissa.

## 3. Koodin Laatu ja Ylläpidettävyys

*   **Ympäristömuuttujat:**
    *   Tarkista ja dokumentoi kaikki tarvittavat ympäristömuuttujat (esim. `.env.example`-tiedostossa). Varmista, että niiden käyttötarkoitus on selkeä.
*   **Kommentointi ja refaktorointi:**
    *   Käy koodi läpi ja lisää kommentteja tarvittaviin kohtiin selkeyttämään monimutkaisempia logiikoita.
    *   Harkitse koodin refaktorointia tietyissä osissa, jos se parantaa luettavuutta tai suorituskykyä.

## 4. Toiminnallisuus

*   **Firebase Authentication:**
    *   Nykyinen `useAuth.ts`-koukku käyttää kovakoodattuja käyttäjätunnuksia (`forecasting@kemppi.com` / `laatu`). Todellisessa sovelluksessa tämä tulisi korvata täydellä Firebase Authentication -integraatiolla (esim. Google Sign-In, Email/Password-rekisteröinti/kirjautuminen, jne.).
*   **Käyttäjätunnisteen (`userId`) normalisointi:**
    *   Jos sähköpostia käytetään jatkossakin `userId`:nä Firestore-dokumenttien tunnisteena, harkitse sen normalisointia (esim. muuntamalla aina pieniksi kirjaimiksi) sekä tallennus- että lukuvaiheessa. Tämä auttaa välttämään ongelmia, jos käyttäjän syöttämä tai Firebase Authenticationin palauttama sähköpostin kirjainkoko vaihtelee, erityisesti jos tiukemmat, sähköpostiin perustuvat Firestore-säännöt otetaan käyttöön.
*   **Oletuspromptin hallinta:**
    *   Oletusprompti ladataan nyt `/docs/gemini_instructions.md`-tiedostosta. Harkitse, onko tämä paras pitkän aikavälin ratkaisu vai pitäisikö oletuspromptikin olla hallittavissa esimerkiksi Firebasen kautta (esim. erillisessä dokumentissa, johon sovelluksella on lukuoikeus).

## 5. Testaus

*   **Yksikkö- ja Integraatiotestit:**
    *   Projektista puuttuu kattava automaattinen testaus. Lisää yksikkötestejä kriittisille funktioille (esim. palvelufunktiot, hookit) ja integraatiotestejä varmistamaan komponenttien ja palveluiden oikea yhteistoiminta.
*   **Käyttäjäkohtaisuuden testaus:**
    *   Kun tiukemmat Firestore-säännöt otetaan käyttöön, testaa huolellisesti, että käyttäjät eivät pääse käsiksi toistensa tietoihin.

## 6. Build-prosessi ja Riippuvuudet

*   **Firebase-riippuvuus:** Varmistettiin, että `firebase`-paketti on `package.json`-tiedostossa, mikä korjasi Vercel-build-ongelman. Tulevaisuudessa riippuvuudet kannattaa lisätä heti, kun niitä aletaan käyttää koodissa.
