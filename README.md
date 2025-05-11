# LiquiDate - NFT Marketplace with Multi-Token Support


LiquiDate is a modern NFT marketplace built on Solana that enables users to purchase NFTs using not just SOL, but also stablecoins (USDC, USDT) and other popular tokens. The platform seamlessly handles token swaps through Jupiter integration, making NFT purchases more accessible and flexible.

## ✨ Features

- 🎨 **Browse Popular Collections**: Explore trending NFT collections on Solana
- 💰 **Multi-Token Purchases**: Buy NFTs using SOL, USDC, USDT, BONK, and TRUMP
- 🔄 **Automatic Token Swaps**: Seamless Jupiter integration for token conversions
- 📊 **Real-Time Pricing**: Live price calculations in your chosen token
- 🌓 **Dark/Light Mode**: Comfortable viewing experience
- 📱 **Responsive Design**: Works perfectly on desktop and mobile
- ⚡ **Fast & Secure**: Built with Next.js 15 and optimized for performance

## 🚀 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Blockchain**: Solana Web3.js, Solana Wallet Adapter
- **APIs**: Magic Eden API, Jupiter Swap API
- **UI Components**: Radix UI, shadcn/ui

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/buy-nft.git
cd buy-nft
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Add the following environment variables:
```env
SOLANA_RPC_URL=your_solana_rpc_url
MAGIC_EDEN_API_KEY=your_magic_eden_api_key
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── collection/        # Collection pages
│   ├── collections/       # Collections listing
│   └── nft/              # NFT detail pages
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── wallet-provider.tsx # Wallet connection provider
├── lib/                   # Utility functions
└── utils/                # Helper functions and types
```

## 🔑 Key Features Explained

### Multi-Token NFT Purchases
LiquiDate allows users to purchase NFTs using various tokens. When a user selects a token other than SOL, the platform:
1. Calculates the required amount in the selected token
2. Gets a quote from Jupiter for the token swap
3. Executes the swap transaction
4. Completes the NFT purchase with the received SOL

### Collection Browsing
- View popular collections with real-time floor prices
- Filter by time periods (1h, 1d, 7d, 30d)
- See collection statistics and trends

### NFT Details
- High-quality image viewing
- Complete metadata display
- Attribute information
- Real-time pricing in multiple tokens
- One-click purchase flow

## 🔗 API Integrations

### Magic Eden API
- Fetches collection data
- Retrieves NFT listings
- Handles purchase transactions

### Jupiter Swap API
- Token price quotes
- Swap transaction creation
- Slippage protection

## 🎨 UI/UX Features

- **Responsive Design**: Optimized for all screen sizes
- **Dark Mode**: Toggle between light and dark themes
- **Smooth Animations**: Framer Motion for elegant transitions
- **Loading States**: Skeleton screens and loading indicators
- **Error Handling**: User-friendly error messages

## 🔒 Security

- Secure wallet connections
- Transaction simulation before execution
- Protected API routes
- Environment variable protection

## 🚀 Deployment

The project is optimized for deployment on Vercel:

```bash
vercel deploy
```

Make sure to add all required environment variables in your Vercel project settings.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Solana](https://solana.com/) for the blockchain infrastructure
- [Magic Eden](https://magiceden.io/) for NFT data and APIs
- [Jupiter](https://jup.ag/) for token swap functionality
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components

## 📞 Contact

- Twitter: [@raut_madridista](https://x.com/raut_madridista)
- GitHub: [@shivaji43](https://github.com/shivaji43)

---

<p align="center">
  Made with ❤️ for the Solana community
</p>
