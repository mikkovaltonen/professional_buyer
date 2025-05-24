# Data Flow Documentation

This document describes how data flows through the application, from Firestore to charts, through the Google API, and back to Firestore.

## Data Flow Overview

```mermaid
graph TD
    A[MariaDB via REST API] --> B[DataService]
    B --> C[ForecastContent]
    C --> D[TimeChart Component]
    
    %% Separate Image Management Flow
    D --> E1[Image Management Service]
    E1 --> F1[Image Storage]
    E1 --> F2[Image Processing]
    E1 --> F3[Image Display]
    
    %% Separate Chat Session Flow
    D --> E2[GeminiChat Component]
    E2 --> F4[Chat Interface in GeminiChat]
    F4 --> G[Google API/Gemini for suggestions]
    G --> H[User Correction Instructions (JSON) via Chat]
    H --> I[ForecastContent.applyCorrectionFromChat]
    I --> J[DataService.applyCorrections (sends multiple product-level POST reqs)]
    J --> A %% Update back to MariaDB via REST API

    %% Independent Image Analysis Flow
    F1 --> G1[Image Analysis]
    F2 --> G1
    G1 --> H1[Image Insights]
    H1 --> I1[Image Corrections]
    I1 --> J
```

## ASCII Visualizations

### 1. Main Data Flow
```
[Firestore] --> [DataService] --> [UI Components] --> [Chart] --> [Separate Services]
     |              |                  |                |           |
     v              v                  v                v           v
[Raw Data] --> [Normalized] --> [Transformed] --> [Visualized] --> [Image/Chat Services]
```

### 2. Component Interaction
```
+----------------+     +------------------+     +----------------+
|  Firestore     |     |   DataService    |     |    UI Layer    |
|  Collection    | --> |  (Singleton)     | --> |  Components    |
+----------------+     +------------------+     +----------------+
        ^                      |                        |
        |                      v                        v
        |              +------------------+     +----------------+
        |              |  Chart Service   |     |  Image Service |
        |              +------------------+     +----------------+
        |                      |                        |
        |                      v                        v
        |              +------------------+     +----------------+
        |              |  Chat Service    |     |  Image Storage |
        |              +------------------+     +----------------+
        |                      |                        |
        |                      v                        v
        |              +------------------+     +----------------+
        |              |  AI Service      |     |  Image Process |
        |              |  (Gemini)        |     +----------------+
        |              +------------------+             |
        |                      |                        v
        |                      v                +----------------+
        |              +------------------+     |  Image Display |
        |              |  User Input      |     +----------------+
        |              +------------------+
        |                      |
        +----------------------+
```

### 3. Data Transformation Flow
```
[Raw Data in Firestore]
        |
        v
[DataService.loadForecastData()]
        |
        v
[TimeSeriesData Interface]
        |
        v
[Chart Data Points]
        |
        v
[Separate Processing Paths]
        |
        +----------------+----------------+
        |                |                |
        v                v                v
[Chart Image]    [Chat Session]    [Image Analysis]
        |                |                |
        v                v                v
[Image Storage]   [AI Analysis]    [Image Insights]
        |                |                |
        v                v                v
[Image Display]   [User Corrections] [Image Corrections]
        |                |                |
        +----------------+----------------+
                        |
                        v
                [Firestore Update]
```

### 4. State Management Flow
```
+------------------+     +------------------+     +------------------+
|  Initial State   |     |  User Action     |     |  Updated State   |
|  (Firestore)     | --> |  (Corrections)   | --> |  (Firestore)     |
+------------------+     +------------------+     +------------------+
        |                        |                        |
        v                        v                        v
+------------------+     +------------------+     +------------------+
|  Data Loading    |     |  Validation      |     |  Batch Update    |
|  (DataService)   |     |  (ApplyButton)   |     |  (Firestore)     |
+------------------+     +------------------+     +------------------+
        |                        |                        |
        v                        v                        v
+------------------+     +------------------+     +------------------+
|  UI Update       |     |  Chart Refresh   |     |  State Sync      |
|  (Components)    |     |  (TimeChart)     |     |  (DataService)   |
+------------------+     +------------------+     +------------------+
```

### 5. Error Handling Flow
```
[Operation Start]
        |
        v
[Validation Layer]
        |
        v
[Error Check] --> [Error] --> [Error Handler] --> [User Notification]
        |              |              |                  |
        v              v              v                  v
[Success Path]    [Log Error]    [Recovery]        [UI Update]
        |              |              |                  |
        v              v              v                  v
[Continue Flow]   [Error Log]    [Retry/Abort]     [Error State]
```

## Detailed Flow Description

### 1. Data Loading (REST API → Application)

**Source Files:**
- `src/lib/dataService.ts`
- `src/components/ForecastContent.tsx`

**Flow:**
1. Data is stored in MariaDB and accessed via a REST API.
2. `DataService` loads data using `fetch` to call the REST API.
3. Data is normalized to `TimeSeriesData` interface (as defined in `api-documentation.md` and `dataService.ts`).
4. Components fetch data through `DataService.getInstance()`.

**Key Methods:**
```typescript
// DataService.ts
public async loadForecastData(): Promise<TimeSeriesData[]>
public getProductGroupData(group: string, productClass?: string): TimeSeriesData[]
public getProductData(productCode: string): TimeSeriesData[]
```

### 2. Chart Visualization and Image Management
(This section remains largely the same conceptually, as it's about frontend rendering)

**Source Files:**
- `src/components/TimeChart.tsx`
- `src/lib/chartUtils.ts`

**Flow:**
1. Data is transformed for chart display.
2. `TimeChart` component renders using Recharts.
3. Image generation for chat (`generateChartImage`) occurs in `chartUtils.ts`.

**Key Components:**
```typescript
// TimeChart.tsx
const TimeChart: React.FC<TimeChartProps>
// chartUtils.ts
export const generateChartImage = (chartData: ChartDataPoint[], title: string)
```

### 3. Chat Session and Forecast Correction Flow (Updated)

**Source Files:**
- `src/components/GeminiChat.tsx`
- `src/components/ForecastContent.tsx`
- `src/lib/dataService.ts`

**Flow:**
1. User interacts with AI (Gemini) via the `GeminiChat` component.
2. AI may suggest a forecast correction as a JSON object (e.g., "increase product X forecast for YYYY-MM by Z%").
3. User confirms or triggers the correction via the chat interface.
4. The `correctionJSON` from Gemini is passed to `ForecastContent.applyCorrectionFromChat(correctionJSON)`.
5. **Correction Processing in `ForecastContent.tsx` (`applyCorrectionFromChat` function):**
    a. The `correctionJSON` is parsed. It's expected to specify the `level` (product, group, or class), `identifier` (code/name of the product, group, or class), `month` (YYYY-MM format), `correctionPercent`, and `explanation`.
    b. **Translation to Product-Level:** If the `level` is 'class' or 'group', `applyCorrectionFromChat` translates this into individual product-level corrections. It identifies all products belonging to the specified class or group (using `selectedClass` from component state for group-level corrections to ensure context).
    c. **Zero Forecast Handling (Frontend):** For each potential target product and the specified month, `applyCorrectionFromChat` fetches its current forecast (prioritizing `new_forecast_manually_adjusted` then `new_forecast`) using `DataService`. Products with a current forecast of zero (or null/undefined) for the target month are **skipped by the frontend** and not included in the correction batch sent to the API. A count of skipped products is maintained for user feedback.
    d. **`ForecastCorrection` Object Creation:** For each valid product-month (i.e., non-zero forecast), a `ForecastCorrection` object is prepared. This object includes:
        - `product_code` (specific product to be corrected)
        - `month` (target month, YYYY-MM)
        - `correction_percent` (the percentage change)
        - `explanation` (reason for the correction)
        - `prod_class` (product class of the target product)
        - `product_group` (product group of the target product)
        - `forecast_corrector` (optional, e.g., "GeminiChatUser")
6. **API Call via `DataService`:** `DataService.applyCorrections(arrayOfForecastCorrectionObjects)` is called. This method iterates through the array and sends **one POST request per `ForecastCorrection` object** to the REST API endpoint (`/api/forecast` as per `maria_db_api-specifications.md` or the `baseUrl` in `DataService`). The `DataService` also adds the `correction_timestamp` to each object before sending.
7. **UI Update:** After all API calls are processed by `DataService.applyCorrections` (successfully or with errors), `ForecastContent.handleCorrectionsApplied()` is triggered. This function calls `dataService.clearCache()` and then reloads all forecast data, ensuring the UI reflects any changes.
8. **User Feedback:** The user receives toast notifications from `ForecastContent.applyCorrectionFromChat` indicating the outcome (overall success, partial success with details on skipped items, or failure).

**Key Methods:**
```typescript
// ForecastContent.tsx
async function applyCorrectionFromChat(correctionJSON: any)
async function handleCorrectionsApplied()

// dataService.ts
public async applyCorrections(corrections: ForecastCorrection[]): Promise<void> 
```

## Data Structures (Frontend Conceptual)

### TimeSeriesData Interface (from API)
(As defined in `dataService.ts` and `api-documentation.md`)
```typescript
export interface TimeSeriesData {
  Year_Month: string;
  prod_class: string;
  prodgroup: string; // Product group code
  prodcode: string;   // Product code
  proddesc1: string; // Product description
  Quantity: number | null;
  new_forecast: number | null;
  old_forecast: number | null;
  old_forecast_error: number | null;
  correction_percent?: number | null;
  explanation?: string | null;
  new_forecast_manually_adjusted: number | null;
  correction_timestamp?: string | null;
}
```

### ChartDataPoint Interface
(Used by `TimeChart` and `generateChartImage`)
```typescript
interface ChartDataPoint {
  date: string; // YYYY-MM
  value: number | null; // Actual Quantity
  forecast?: number | null; // Typically new_forecast
  old_forecast?: number | null;
  new_forecast_manually_adjusted?: number | null;
  old_forecast_error?: number | null;
  explanation?: string;
}
```

### ForecastCorrection Object (Payload for DataService.applyCorrections)
(This is the `ForecastCorrection` interface defined in `dataService.ts`)
```typescript
export interface ForecastCorrection {
  product_group?: string; // Product group code
  product_code?: string;  // Product code
  month: string;          // Target month (YYYY-MM)
  correction_percent: number;
  explanation: string;
  forecast_corrector?: string;
  prod_class?: string;
}
// DataService internally adds correction_timestamp before sending to the API.
// The actual API payload includes Year_Month, prod_class, prodgroup, prodcode etc.
```

### Database Schema (MariaDB)
Refer to `docs/maria_db_api-specifications.md` for the `forecast_data` table structure. Data is stored in and retrieved from MariaDB via the REST API.

## Color Coding in Charts
(This section remains valid)
...

## Error Handling
(General principles remain valid. Specifics for REST API interactions are handled in `DataService` and `ForecastContent`.)

1. **Data Loading (REST API):**
   - `DataService` handles API errors (network, HTTP status codes).
   - `ForecastContent` displays toast notifications on load failure.
2. **Chat Interface & Corrections:**
   - Validation of `correctionJSON` in `applyCorrectionFromChat`.
   - Errors from `DataService.applyCorrections` (individual API call failures) are caught in `applyCorrectionFromChat`.
   - User receives feedback via toast messages detailing success, partial success (due to skipped items), or failure.
...

## Performance Considerations

1. **Data Caching:**
   - `DataService` caches data in memory (`this.data`).
   - `clearCache()` is called by `handleCorrectionsApplied` (which is invoked after corrections via `applyCorrectionFromChat`) to ensure fresh data is loaded.
   - REST API might have its own server-side caching.
...

## Security

1. **Authentication:**
   - Bearer token authentication for the REST API.
   - Token is managed by `DataService`.
...

## Datarakenne (Conceptual Frontend Types)

### Ennustedata (`TimeSeriesData` from DataService)
```typescript
// Matches the TimeSeriesData interface in dataService.ts
export interface TimeSeriesData {
  Year_Month: string;
  prod_class: string;
  prodgroup: string;
  prodcode: string;
  proddesc1: string;
  Quantity: number | null;
  new_forecast: number | null;
  old_forecast: number | null;
  old_forecast_error: number | null;
  correction_percent?: number | null;
  explanation?: string | null;
  new_forecast_manually_adjusted: number | null;
  correction_timestamp?: string | null;
}
```

### Lähetettävä Korjausdata (`ForecastCorrection` interface in DataService)
```typescript
// Matches the ForecastCorrection interface in dataService.ts
export interface ForecastCorrection {
  product_group?: string;
  product_code?: string;
  month: string; // YYYY-MM
  correction_percent: number;
  explanation: string;
  forecast_corrector?: string;
  prod_class?: string;
}
```

## Tiedostomuodot
(This section is likely outdated as data interaction is now primarily via REST API, not direct file operations for corrections in this flow)

### JSON
```json
{
  "date": "2024-03-20",
  "quantity": 100,
  "old_forecast": 90,
  "new_forecast": 95,
  "new_forecast_manually_adjusted": 105,
  "old_forecast_error": 10,
  "correction_percent": 10.5,
  "explanation": "Korjaus perustuu markkinatietoihin",
  "correction_timestamp": "2024-03-20T12:00:00Z"
}
```

### CSV
```csv
date,quantity,old_forecast,new_forecast,new_forecast_manually_adjusted,old_forecast_error,correction_percent,explanation,correction_timestamp
2024-03-20,100,90,95,105,10,10.5,"Korjaus perustuu markkinatietoihin","2024-03-20T12:00:00Z"
```

## Virheenkäsittely

### Tiedoston käsittely
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

## Image Processing and API Integration

### Image Generation Flow
```
[Chart Data] --> [Canvas/Chart.js] --> [Image Generation] --> [Format Conversion] --> [Base64 Encoding]
     |                |                      |                      |                      |
     v                v                      v                      v                      v
[Raw Values] --> [Visualization] --> [Quality Settings] --> [JPEG/PNG] --> [API Compatible Format]
```

### Image Quality Considerations
1. User View:
   - Original chart rendering
   - Full resolution
   - Interactive elements
   - Real-time updates

2. API View:
   - JPEG format (0.7 quality)
   - Base64 encoded
   - Fixed dimensions
   - Static representation

### Potential Differences
1. Format Conversion:
   - Original → JPEG conversion may affect quality
   - Base64 encoding adds overhead
   - Compression may affect text clarity

2. Processing Steps:
   - Canvas rendering
   - Format conversion
   - Quality adjustment
   - Base64 encoding

### Best Practices
1. Image Generation:
   - Use consistent dimensions
   - Maintain text readability
   - Consider API size limits
   - Monitor quality impact

2. API Integration:
   - Validate image format
   - Check size limits
   - Handle conversion errors
   - Log processing steps

### Monitoring and Debugging
1. Image Processing:
   - Log conversion steps
   - Track quality metrics
   - Monitor size changes
   - Validate output format

2. API Integration:
   - Track API responses
   - Monitor error rates
   - Validate image recognition
   - Log processing times