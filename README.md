# Insurance Vault

A smart insurance management platform powered by AI, built with modern web technologies.

## Features

- 🔒 **Secure Document Storage**: Safely store and manage insurance documents
- 🤖 **AI-Powered Optimization**: Get intelligent insurance coverage recommendations
- 💰 **Cost Savings Analysis**: Optimize your insurance spending
- 🛡️ **Complete Protection**: Comprehensive coverage management
- 🌐 **Multi-language Support**: Available in English, Danish, Finnish, Swedish, Estonian and Norwegian
- 🔐 **Firebase Authentication**: Secure user authentication and data storage
- 📱 **Responsive Design**: Works seamlessly across devices

## Pages Structure

### Main Pages
- **Index (/)**: Landing page with feature overview
- **About (/about)**: Company information and mission
- **Products (/products)**: Insurance product catalog
- **Workbench (/workbench)**: Main dashboard for logged-in users

### Insurance Type Pages
- **/car-insurance**: Car insurance details and quotes
- **/home-insurance**: Home insurance information
- **/travel-insurance**: Travel coverage options
- **/health-insurance**: Health insurance plans
- **/life-insurance**: Life insurance policies
- **/pet-insurance**: Pet insurance coverage
- **/boat-insurance**: Boat insurance details

### Feature Pages
- **/secure-storage**: Document management system
- **/ai-optimization**: AI-powered insurance analysis
- **/cost-savings**: Cost optimization tools
- **/complete-protection**: Comprehensive coverage options

### Risk Assessment System
The platform includes a sophisticated risk assessment tool that helps users understand their insurance needs:

1. **Financial Assessment Questions**:
   - Deductible preferences
   - Coverage level preferences
   - Self-insurance comfort level
   - Policy bundling preferences
   - Data sharing preferences

2. **Property Protection Assessment**:
   - Emergency fund availability
   - Property damage coverage needs
   - Asset protection requirements

3. **Activity Assessment**:
   - Travel frequency
   - Vehicle usage patterns
   - Occupational risks
   - Lifestyle considerations

The assessment provides personalized recommendations while maintaining user privacy. All responses are:
- Encrypted and securely stored
- Used only for AI analysis
- Never shared with third parties

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **Analytics**: Firebase Analytics
- **Internationalization**: i18next
- **Charts**: Recharts
- **Form Handling**: React Hook Form
- **Validation**: Zod

## Getting Started

1. Clone the repository
```bash
git clone <repository-url>
cd insurance-vault
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

Update `.env.local` with your Firebase and OpenAI credentials:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_OPENAI_API_KEY`

4. Start development server
```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
insurance-vault/
├── src/
│   ├── components/     # Reusable UI components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility functions and configurations
│   ├── pages/         # Page components
│   └── App.tsx        # Root component
├── public/            # Static assets
└── ...config files
```

## Security

- Firebase Security Rules are configured for secure data access
- Environment variables are properly handled
- Authentication state is managed securely
- Risk assessment data is encrypted

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For support, please contact [support@pricerobot.com](mailto:support@pricerobot.com)
