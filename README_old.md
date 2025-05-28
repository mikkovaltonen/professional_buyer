# Professional Buyer - AI-Powered Procurement Assistant

Professional Buyer on tekoälyavusteinen hankinta-assistentti, joka auttaa yrityksiä optimoimaan hankintaprosessejaan ja saavuttamaan kustannussäästöjä.

## Järjestelmän Arkkitehtuuri

![Agentic Workflow](Public/Agentic%20workflow%20and%20tools.png)

### Agentit (Agents)

**1. ProfessionalBuyerAssistant (Triage Agent)**
- Pääagentti joka ohjaa käyttäjän kyselyt oikeille erikoisagenteille
- Tarjoaa hankinnan asiantuntijaneuvontaa
- Keskittyy kolmeen pääetuu: kustannussäästöt, kiinteät maksut, strateginen aika

**2. SearchAgent**
- Reaaliaikainen webhaку markkinatrendien ja toimittajatietojen hakemiseen
- Käyttää WebSearchTool-työkalua
- Aktivoituu kun tarvitaan ajantasaista markkinadataa

**3. InternalKnowledgeSearchAgent**
- Sisäisten hankintadokumenttien hakuagentti
- Hakee toimittaja katalogit, kilpailutetut sopimukset, kilpailutetut hinnat ja tuotteet
- Käyttää FileSearchTool-työkalua vector storen kanssa
- Erikoistunut sisäisen datan hakuun sopimusehdoista, hintatiedoista ja toimittajatiedoista

**4. ApprovalSpecialistAgent**
- Ostotilausten hyväksyntä- ja valtuutusagentti
- Hoitaa hyväksyntätyönkulkuja ja sidosryhmäviestintää
- Käyttää request_po_approval ja send_email työkaluja
- Käsittelee approval-prosessit ja automaattiset ilmoitukset

**5. POPostingAgent (PO Posting Agent)**
- Erikoistunut ostotilausten lähettämiseen ERP-järjestelmään
- Käyttää po_posting_api-työkalua
- Käsittelee toimittaja, tuote ja hinta -parametrit

### Työkalut (Tools)

**1. get_account_info**
- Hakee käyttäjätilin tiedot ja hankintatilastot
- Palauttaa säästöt, sopimukset ja viimeisimmät neuvottelut

**2. po_posting_api**
- Lähettää ostotilauksen ERP-järjestelmään
- Ottaa vastaan: toimittaja, tuote, hinta
- Palauttaa: "PO posted successfully in ERP"

**3. request_po_approval**
- Pyytää ostotilauksen hyväksyntää
- Ottaa vastaan: po_number, amount, reason
- Palauttaa: approval_id, status, arvioitu hyväksyntäaika

**4. send_email**
- Lähettää sähköpostiviestejä sidosryhmille
- Ottaa vastaan: recipient, subject, message
- Palauttaa: email_id, delivery_status

**5. save_po_to_erp**
- Tallentaa monipuolisia ostotilauksia ERP/P2P-järjestelmään
- Sisältää hyväksyntälogiikan ja seurantaa

**6. save_to_vector_store**
- Tallentaa strukturoitua hankintadataa vector storeen
- Käyttää VECTOR_STORE_ID ympäristömuuttujaa
- Tukee metadatan tallentamista JSON-muodossa

**7. WebSearchTool**
- Reaaliaikainen webhaку
- Markkinatrendien ja toimittajatietojen haku

**8. FileSearchTool**
- Hakee tietoa vector storesta
- Toimittaja katalogit, kilpailutetut sopimukset, hinnat ja tuotteet

## Asennus

1. Luo virtuaaliympäristö:
```powershell
python -m venv venv
```

2. Aktivoi virtuaaliympäristö:
```powershell
.\venv\Scripts\activate
```

3. Asenna riippuvuudet:
```powershell
pip install -r requirements.txt
```

## Ympäristömuuttujat

Luo `.env` tiedosto projektin juureen ja lisää seuraavat muuttujat:
```
OPENAI_API_KEY="your_openai_api_key_here"
VECTOR_STORE_ID="your_vector_store_id_here"
SECRET_KEY="your_flask_secret_key_here"
```

## Käynnistys

Käynnistä Flask web-sovellus:
```powershell
python app.py
```

Avaa selain osoitteeseen: http://localhost:5000

**Kirjautumistiedot:**
- Käyttäjätunnus: admin
- Salasana: password123

## Tiedostorakenne

```
├── app.py                 # Flask web-sovellus
├── my_agents.py          # Kaikki agentit
├── tools.py              # Työkalufunktiot
├── requirements.txt      # Python-riippuvuudet
├── templates/           # HTML-sivupohjat
│   ├── landing.html
│   ├── login.html
│   └── workbench.html
└── Public/              # Staattiset tiedostot
    └── Agentic workflow and tools.png
```

## Käyttö

1. Kirjaudu sisään web-käyttöliittymään
2. Kysy hankinnan asiantuntijaneuvontaa chatissa
3. Pyydä ostotilausten luontia: "Luo ostotilaus toimittajalle X tuotteelle Y hinnalla Z"
4. Hae sisäisiä tietoja: "Etsi kilpailutettuja sopimuksia toimittajalle X"
5. Pyydä hyväksyntöjä: "Pyydä hyväksyntää ostotilaukselle 12345"
6. Hae markkinatrendejä ja toimittajatietoja
7. Käytä chat-kontrollit:
   - **Reset Chat** - Tyhjennä keskustelu ja aloita alusta
   - **Attach Documents** - Liitä PDF, Word, kuva tai tekstitiedostoja

## Keskeiset Ominaisuudet

### AI-Agentit Erikoistehtäviin
- **Sisäinen tiedonhaku** - Toimittaja katalogit, sopimukset, hinnat
- **Hyväksyntäprosessit** - Automaattiset approval-työkulut ja sähköposti-ilmoitukset
- **ERP-integraatio** - Suora ostotilausten lähetys järjestelmään
- **Markkinaanalyysi** - Reaaliaikainen kilpailija- ja hintatiedon haku

### Käyttöliittymän Ominaisuudet
- **Reset Chat** - Tyhjennä keskustelu yhdellä klikkauksella
- **Attach Documents** - Liitä tiedostoja analysoitavaksi (PDF, Word, kuvat)
- **Quick Actions** - Pikavalintapainikkeet yleisiin kyselyihin
- **Responsiivinen design** - Toimii kaikilla laitteilla

### Keskeiset Hyödyt
1. **Säästä rahaa** - Linjassa neuvoteltujen sopimusten kanssa
2. **Säästä kiinteitä maksuja** - Sisäiset hankintapalvelut
3. **Strateginen aika** - Vapautuminen operatiivisista transaktioista strategisiin säästöihin

## Riippuvuudet

Sovellus käyttää seuraavia pääkomponentteja:
- Flask==3.1.1
- openai-agents==0.0.14
- python-dotenv==1.1.0
- agents library (OpenAI)

Koko listan riippuvuuksista löydät requirements.txt tiedostosta. 