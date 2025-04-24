# Test info

- Name: Product Selection UI Tests >> should show chart when product is selected
- Location: C:\Users\mikbu\Documents\Konsultointi 2025\Vuono\SCM Best\AI Kysyntäennusteavustaja\src\tests\ui\productSelection.test.ts:40:3

# Error details

```
Error: page.waitForSelector: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('input[type="radio"]') to be visible

    at C:\Users\mikbu\Documents\Konsultointi 2025\Vuono\SCM Best\AI Kysyntäennusteavustaja\src\tests\ui\productSelection.test.ts:8:16
```

# Page snapshot

```yaml
- navigation:
  - link "WISESTEIN Supply Chain Management At Its Best.":
    - /url: /
  - link "Kirjaudu sisään":
    - /url: /login
- main:
  - heading "AI Kysyntäennusteavustaja" [level=1]
  - paragraph: Ennusta kysyntää tuotteille, joilla ei ole riittävää tilastollista dataa.
  - paragraph: Tehosta ostoprosessiasi ja paranna varastonhallintaa älykkään kysynnän ennusteen avulla.
  - button "Varaa esittely"
  - heading "Älykkäämpi tapa ennustaa kysyntää" [level=2]
  - img
  - heading "Tekoälyavusteinen ennustaminen" [level=3]
  - paragraph: Hyödynnä edistynyttä tekoälyä tuotteiden kysynnän ennustamiseen, erityisesti kun tilastollista dataa on vähän.
  - img
  - heading "Dokumentoi ja opi" [level=3]
  - paragraph: Tallenna vaikeat päätösongelmat ja väärät mitoitukset. Hae helposti arkistosta aiemmat tapaukset ja nopeuta oppimista.
  - img
  - heading "Syvähaku signaaleista" [level=3]
  - paragraph: Löydä automaattisesti kaikki tuotteesi kysyntään vaikuttavat uutiset ja signaalit internetistä. Tee tietoon perustuvia päätöksiä.
  - heading "Ota käyttöön tekoälyavusteinen ennustaminen" [level=2]
  - button "Varaa esittely"
  - link "Kirjaudu sisään →":
    - /url: /login
- contentinfo:
  - heading "Palvelut" [level=3]
  - list:
    - listitem:
      - link "Koulutuspalvelut":
        - /url: https://wisestein.fi/palvelut/#koulutuspalvelut
    - listitem:
      - link "Konsultointipalvelut":
        - /url: https://wisestein.fi/palvelut/#konsultointipalvelut
  - heading "Ratkaisut" [level=3]
  - list:
    - listitem:
      - link "Myynnille":
        - /url: https://wisestein.fi/ratkaisut/myynnille
    - listitem:
      - link "Ostolle":
        - /url: https://wisestein.fi/ratkaisut/ostolle
    - listitem:
      - link "Markkinoinnille":
        - /url: https://wisestein.fi/ratkaisut/#markkinoinnille
    - listitem:
      - link "Valmistukselle":
        - /url: https://wisestein.fi/ratkaisut/valmistukselle
    - listitem:
      - link "Taloushallinnolle":
        - /url: https://wisestein.fi/ratkaisut/taloushallinnolle
    - listitem:
      - link "Logistiikalle":
        - /url: https://wisestein.fi/ratkaisut/logistiikalle
  - heading "Yritys" [level=3]
  - list:
    - listitem:
      - link "Historia":
        - /url: https://wisestein.fi/yritys#historia
    - listitem:
      - link "Tiimi":
        - /url: https://wisestein.fi/yritys#tiimi
  - heading "Yhteystiedot" [level=3]
  - list:
    - listitem:
      - link "Toimistomme":
        - /url: https://wisestein.fi/yhteystiedot#toimistomme
    - listitem:
      - link "Asiakastuki":
        - /url: https://wisestein.fi/yhteystiedot#asiakastuki
    - listitem:
      - link "Laskutus":
        - /url: https://wisestein.fi/yhteystiedot#laskutus
  - paragraph: © 2025 Wisestein. Kaikki oikeudet pidätetään.
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Product Selection UI Tests', () => {
   4 |   test.beforeEach(async ({ page }) => {
   5 |     // Navigate to the workbench page
   6 |     await page.goto('http://localhost:8080/workbench');
   7 |     // Wait for the initial data load by looking for the radio inputs
>  8 |     await page.waitForSelector('input[type="radio"]');
     |                ^ Error: page.waitForSelector: Test timeout of 60000ms exceeded.
   9 |   });
  10 |
  11 |   test('should load and display product groups', async ({ page }) => {
  12 |     // Check if both product groups are visible
  13 |     const powerSourcesRadio = page.locator('input[type="radio"]').filter({ hasText: 'Power Sources' });
  14 |     const coversRadio = page.locator('input[type="radio"]').filter({ hasText: 'Covers' });
  15 |     
  16 |     await expect(powerSourcesRadio).toBeVisible();
  17 |     await expect(coversRadio).toBeVisible();
  18 |   });
  19 |
  20 |   test('should show products when group is selected', async ({ page }) => {
  21 |     // Select Power Sources group
  22 |     await page.click('label:has-text("Power Sources")');
  23 |     
  24 |     // Wait for products section to appear
  25 |     await page.waitForSelector('text="Valitse tuote"');
  26 |     
  27 |     // Check if products are visible
  28 |     const products = [
  29 |       'MINARCTIG EVO 200MLP POWER SOURCE',
  30 |       'X3P POWER SOURCE PULSE 450 W',
  31 |       'X5 POWER SOURCE 400 PULSE WP'
  32 |     ];
  33 |
  34 |     for (const product of products) {
  35 |       const productElement = page.locator(`label:has-text("${product}")`);
  36 |       await expect(productElement).toBeVisible();
  37 |     }
  38 |   });
  39 |
  40 |   test('should show chart when product is selected', async ({ page }) => {
  41 |     // Select Power Sources group
  42 |     await page.click('label:has-text("Power Sources")');
  43 |     await page.waitForSelector('text="Valitse tuote"');
  44 |     
  45 |     // Select first product
  46 |     await page.click('label:has-text("MINARCTIG EVO 200MLP POWER SOURCE")');
  47 |     
  48 |     // Wait for chart to appear
  49 |     await page.waitForSelector('img[alt="Valittu tuote"]');
  50 |     
  51 |     // Verify chart is visible
  52 |     const chart = page.locator('img[alt="Valittu tuote"]');
  53 |     await expect(chart).toBeVisible();
  54 |   });
  55 |
  56 |   test('should handle group switching correctly', async ({ page }) => {
  57 |     // Select Power Sources group
  58 |     await page.click('label:has-text("Power Sources")');
  59 |     await page.waitForSelector('label:has-text("MINARCTIG EVO 200MLP POWER SOURCE")');
  60 |     
  61 |     // Switch to Covers group
  62 |     await page.click('label:has-text("Covers")');
  63 |     
  64 |     // Check if Covers products are visible
  65 |     const coverProducts = [
  66 |       'MINARCTIG EVO 200MLP Cover',
  67 |       'X3P Cover PULSE 450 W',
  68 |       'X5 Cover 400 PULSE WP'
  69 |     ];
  70 |
  71 |     for (const product of coverProducts) {
  72 |       const productElement = page.locator(`label:has-text("${product}")`);
  73 |       await expect(productElement).toBeVisible();
  74 |     }
  75 |   });
  76 | }); 
```