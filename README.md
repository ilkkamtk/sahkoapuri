# Sähköapuri

**Sähköapuri** (Electricity Helper) is a Node.js application that helps you analyze your electricity consumption costs and compare spot/dynamic pricing against fixed-rate contracts.

## 🎯 Purpose

Understanding whether a fixed electricity rate (e.g., 8 cents/kWh) makes financial sense compared to dynamic spot pricing requires analyzing your actual consumption pattern. While the average spot price might be 6.3 cents/kWh, your actual cost depends on **when** you consume electricity.

Sähköapuri calculates your **consumption-weighted average price** by matching your hourly consumption data with historical spot prices from the Nordic electricity market.

## ✨ Features

- 📊 **Smart Excel Analysis**: Upload consumption reports from any electricity provider
- 🤖 **AI-Powered Column Detection**: Automatically identifies datetime, consumption columns, and data intervals
- 📅 **Multi-Format Support**: Handles various date formats (Finnish, ISO, Excel dates)
- ⏱️ **Flexible Intervals**: Works with both 15-minute and hourly consumption data
- 💰 **Accurate Cost Calculation**: Consumption-weighted average price for realistic comparisons
- 🔄 **Automatic Price Updates**: Fetches latest spot prices from [porssisahko.net](https://porssisahko.net)
- 🌍 **Timezone Aware**: Properly handles Helsinki timezone for price matching

## 🛠️ Tech Stack

- **Runtime**: Node.js 24+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **AI**: OpenAI GPT-3.5 Turbo
- **Excel Processing**: ExcelJS
- **Date/Time**: Luxon
- **Validation**: Zod
- **Testing**: Jest

## 📋 Prerequisites

- Node.js 24.13 or higher
- MongoDB instance
- OpenAI API key

## 🚀 Installation

1. Clone the repository:

```bash
git clone https://github.com/ilkkamtk/sahkoapuri.git
cd sahkoapuri
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` file based on `.env_sample`:

```env
MONGO_DB=mongodb://localhost:27017/sahkoapuri
PORT=3000
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET=your_jwt_secret
```

4. Build the project:

```bash
npm run build
```

## 🎮 Usage

### Development Mode

```bash
npm run dev
```

Runs with `nodemon` and `ts-node` for hot-reloading.

### Production Mode

```bash
npm start
```

### Testing

```bash
npm test
```

## 📡 API Endpoints

### Upload Consumption Data

**POST** `/api/v1/uploads`

Upload an Excel file (.xlsx) containing electricity consumption data.

**Request**:

- Content-Type: `multipart/form-data`
- Field: `file` (Excel file)

**Response**:

```json
{
  "aiAnalysis": {
    "consumption": "Kokonaissiirto (kWh)",
    "datetime": "Ajankohta",
    "interval": "1hour",
    "dateFormat": "d.M.yyyy HH:mm"
  },
  "totalConsumption": 14819.63,
  "averagePrice": 5.82
}
```

### Get Price Data

**GET** `/api/v1/prices?startDate=2025-01-01T00:00:00Z&endDate=2025-01-02T23:59:59Z`

Retrieves spot prices for a date range.

**Response**:

```json
[
  {
    "date": "2025-01-01T00:00:00.000Z",
    "price": 0.503
  },
  {
    "date": "2025-01-01T00:15:00.000Z",
    "price": 0.503
  }
]
```

## 🔍 How It Works

1. **Upload**: You upload your electricity consumption report (Excel file)
2. **AI Analysis**: GPT-3.5 analyzes the file structure and identifies:
   - Which column contains consumption data
   - Which column contains datetime information
   - Whether data is in 15-minute or hourly intervals
   - The date format used
3. **Price Matching**: Each consumption entry is matched with the corresponding spot price from the same hour, accounting for timezone differences
4. **Calculation**: Average price is calculated as:
   ```
   Average Price (cents/kWh) = Total Cost / Total Consumption
   Total Cost = Σ(hourly_price × hourly_consumption)
   ```
5. **Result**: You get your actual average cost based on your consumption pattern

## 📊 Supported Date Formats

The AI automatically detects and handles:

- `d.M.yyyy HH:mm` (e.g., "1.1.2025 14:30")
- `HH:mm dd.MM.yyyy` (e.g., "14:30 01.01.2025")
- `yyyy-MM-dd HH:mm` (e.g., "2025-01-01 14:30")
- ISO 8601 strings (e.g., "2026-02-04T00:00:00.000Z")
- Excel Date objects

## 📁 Project Structure

```
sähköapuri/
├── src/
│   ├── api/v1/
│   │   ├── controllers/      # Request handlers
│   │   ├── models/           # Mongoose schemas
│   │   ├── routes/           # Route definitions
│   │   └── schemas/          # Zod validation schemas
│   ├── classes/              # Custom error classes
│   ├── middlewares/          # Express middlewares
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Utility functions
│   ├── app.ts                # Express app configuration
│   └── index.ts              # Entry point
├── tests/                    # Jest tests
├── public/                   # Static files
├── assets/                   # Price data storage
└── dist/                     # Compiled JavaScript
```

## 🧪 Testing

The project includes comprehensive tests for:

- Upload endpoint with various Excel formats
- Price fetching and storage
- Date format detection
- Interval detection (15-min vs hourly)
- Timezone handling

Example test file:

```bash
npm test -- uploads.test.ts
```

## 🔧 Development

### Build

```bash
npm run build
```

Compiles TypeScript and resolves path aliases.

### Type Checking

TypeScript strict mode is enabled for type safety.

### Path Aliases

Use `@/` prefix for imports from `src/`:

```typescript
import CustomError from '@/classes/CustomError';
```

## 📝 Example Use Case

**Scenario**: You're deciding between:

- Fixed rate: 8 cents/kWh
- Spot pricing with transfer fee: Market price + 0.3 cents/kWh

**Steps**:

1. Download your consumption report from your electricity provider
2. Upload it to `/api/v1/uploads`
3. Check the `averagePrice` in the response
4. Add your transfer fee: `5.82 + 0.3 = 6.12 cents/kWh`
5. Compare: 6.12 cents/kWh (spot) vs 8 cents/kWh (fixed) → **Spot pricing saves 23%**

## 🤝 Contributing

Contributions are welcome! Please ensure:

- Code follows ESLint configuration
- All tests pass (`npm test`)
- TypeScript compiles without errors (`npm run build`)

## 📄 License

ISC

## 🙏 Acknowledgments

- Price data from [Porssisähkö.net](https://porssisahko.net)
- Nordic electricity spot prices from Nord Pool

## ⚠️ Disclaimer

This tool provides analysis based on historical data. Actual future costs may vary. Always verify calculations and consult with your electricity provider before making contract decisions.
