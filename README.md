# vogame.com - K12 Science Concept Visualization Games

vogame.com is an interactive science education platform designed for K-12 students to visualize and understand complex scientific concepts through engaging simulations.

## 🎯 Vision & Mission

Our mission is to make abstract science concepts "visible, playable, and evidence-based" for K-12 students. We provide interactive simulation games that help students visualize and understand complex scientific principles.

## 🚀 Features

- **Interactive Simulations**: 12 different science concept games covering physics, chemistry, and biology
- **Adaptive Learning**: Personalized feedback and scaffolding based on student performance
- **Progress Tracking**: Detailed reports for parents and educators
- **Cross-Platform**: Responsive design works on desktop, tablet, and mobile
- **PWA**: Offline functionality for uninterrupted learning
- **Accessibility**: Designed with accessibility in mind, including color contrast and keyboard navigation
- **Multi-language**: Support for English and Chinese

## 📚 Available Modules

1. **Buoyancy Lab** - Explore density and buoyancy concepts
2. **Circuit Debugger** - Learn about electrical circuits and troubleshooting
3. **Force & Motion Playground** - Understand Newton's laws of motion
4. **Friction & Ramp** - Investigate friction and inclined planes
5. **Levers & Pulleys Builder** - Experiment with simple machines
6. **Projectile Sandbox** - Explore projectile motion
7. **Optics Lab** - Discover light reflection and refraction
8. **Sound & Wave Studio** - Learn about sound waves and properties
9. **Heat Transfer Lab** - Study thermal energy and heat transfer
10. **Energy Skate Park** - Explore conservation of energy
11. **Magnet & Electromagnet** - Investigate magnetic fields
12. **Gas Pressure Lab** - Understand gas laws and pressure-volume relationships

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Components**: Custom design system with Tailwind CSS
- **Graphics**: PixiJS for hardware-accelerated 2D rendering
- **Charts**: uPlot for performance-oriented data visualization
- **State Management**: Zustand
- **Internationalization**: i18next

### Backend
- **API**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payment**: Stripe

### DevOps
- **Monorepo**: pnpm + Turborepo
- **Deployment**: Vercel
- **Monitoring**: Sentry

## 🏗 Architecture

The project follows a monorepo architecture with the following packages:

- `apps/web` - Next.js web application
- `packages/ui` - Reusable UI components
- `packages/sim-core` - Core simulation engine
- `packages/sim-modules` - Individual simulation modules
- `packages/charts` - Data visualization components
- `packages/analytics-sdk` - Analytics and event tracking
- `packages/i18n` - Internationalization utilities

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/vogame.git
   cd vogame
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create environment variables:
   ```bash
   cp .env.example .env.local
   # Fill in the required values
   ```

4. Run the development server:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🧪 Testing

Run tests for the entire monorepo:

```bash
pnpm test
```

Run tests for a specific package:

```bash
cd packages/sim-core
pnpm test
```

## 🏗️ Building

Build the entire monorepo:

```bash
pnpm build
```

## 📝 Scripts Available

- `pnpm dev` - Start development servers for all apps
- `pnpm build` - Build all packages and apps
- `pnpm lint` - Lint all packages and apps
- `pnpm typecheck` - Run type checking across the monorepo
- `pnpm format` - Format code with Prettier

## 🤝 Contributing

We welcome contributions from the community! Please see our [Contributing Guide](CONTRIBUTING.md) for more details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, contact us at [support@vogame.com](mailto:support@vogame.com).

---

Made with ❤️ for science education