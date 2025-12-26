# Powers Explorer

> An interactive web-based educational tool for exploring the magnitude of large and small numbers through cosmic scale visualization.

![Version](https://img.shields.io/badge/version-1.0.0--dev-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-web-orange)

## Overview

**Powers Explorer** is an educational application designed for high school mathematics instruction (ages 14-18) that helps students develop intuition about orders of magnitude through interactive visualization. The tool enables exploration of scales ranging from quantum mechanics (Planck length, 10^-35 meters) to cosmic distances (observable universe, 10^26 meters).

### Educational Objectives

- **Scale Comprehension**: Develop intuition for orders of magnitude across 61 powers of ten
- **Comparative Understanding**: Enable direct comparison of cosmic object sizes and distances
- **Speed of Light Visualization**: Make astronomical distances tangible through light travel time
- **Scientific Literacy**: Present accurate scientific data in an engaging, interactive format

### Key Features

#### 🌌 Cosmic Object Comparison Mode
- Select two objects from a curated library of cosmic entities
- View objects at accurate relative scale
- Animate separation to real scaled distances
- Visualize light traveling between objects at true speed
- Display educational facts and scientific measurements

#### 🔬 Powers of Ten Explorer Mode
- Zoom through 61 scale levels using mouse wheel
- Seamless transitions from subatomic to cosmic scales
- Dynamic object rendering based on current scale
- Real-time scale indicators and measurements
- Contextual backgrounds (quantum, terrestrial, space)

## Technology Stack

- **Framework**: [Phaser 3](https://phaser.io/) (v3.70+) - 2D game framework for animations and rendering
- **Build Tool**: [Vite](https://vitejs.dev/) - Fast development server with HMR
- **Language**: JavaScript (ES6+)
- **Deployment**: Static web hosting 

### Why This Stack?

- **Phaser**: Excellent 2D rendering performance, rich animation system, perfect for educational visualizations
- **Vite**: Lightning-fast dev server, optimized production builds, zero-config setup
- **JavaScript**: Universal browser support, no compilation required, easy to extend

## Project Structure

```
powersExplorer/
├── public/                          # Static assets
│   ├── index.html                   # Entry HTML
│   └── assets/
│       ├── images/                  # Sprites and textures
│       │   ├── cosmic-objects/      # Object visualizations
│       │   └── ui/                  # UI elements
│       ├── data/                    # JSON data files
│       │   ├── cosmic-objects.json  # 50-100 preset objects
│       │   ├── scale-levels.json    # 61 scale definitions
│       │   └── physical-constants.json
│       └── fonts/                   # Web fonts
├── src/                             # Source code
│   ├── main.js                      # Application entry point
│   ├── scenes/                      # Phaser scenes
│   │   ├── BootScene.js             # Asset loading
│   │   ├── MenuScene.js             # Mode selection
│   │   ├── CosmicComparisonScene.js # Comparison mode
│   │   ├── PowersOfTenScene.js      # Powers of ten mode
│   │   └── UIOverlayScene.js        # Persistent UI
│   ├── models/                      # Data models
│   ├── managers/                    # Core systems
│   │   ├── DataManager.js           # Data loading/caching
│   │   ├── StateManager.js          # App state
│   │   └── AnimationManager.js      # Reusable animations
│   ├── components/                  # UI components
│   │   ├── comparison/              # Comparison mode components
│   │   ├── powers-of-ten/           # Powers mode components
│   │   └── ui/                      # Shared UI components
│   ├── utils/                       # Utilities
│   │   ├── ScaleCalculator.js       # Scale mathematics
│   │   └── Constants.js             # App constants
│   └── config/                      # Configuration
│       └── phaserConfig.js          # Phaser settings
├── docs/                            # Documentation
│   ├── ARCHITECTURE.md              # Technical architecture
│   ├── PEDAGOGY.md                  # Educational design
│   ├── DATA_SOURCES.md              # Scientific references
│   └── USER_GUIDE.md                # End-user guide
├── package.json                     # Dependencies
├── vite.config.js                   # Build configuration
└── README.md                        # This file
```

## Getting Started

### Prerequisites

- **Node.js**: v16.0 or higher
- **npm**: v7.0 or higher (comes with Node.js)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/powersExplorer.git
   cd powersExplorer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - Navigate to `http://localhost:5173`
   - The app will automatically reload on file changes

### Build for Production

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

The production files will be in the `dist/` directory, ready for deployment.

## Usage

### For Students

1. **Launch the application** in your web browser
2. **Choose a mode** from the main menu:
   - **Cosmic Comparison**: Compare sizes and distances of cosmic objects
   - **Powers of Ten**: Zoom through scales from quantum to cosmic
3. **Interact** using mouse clicks and scroll wheel
4. **Explore** educational facts by clicking on objects

### For Educators

See [PEDAGOGY.md](./docs/PEDAGOGY.md) for:
- Suggested classroom activities
- Discussion prompts
- Curriculum alignment
- Assessment strategies
- Common misconceptions addressed

### For Developers

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for:
- System architecture overview
- Component design patterns
- State management
- Extension guidelines

## Development Workflow

### Running Tests

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Code Quality

```bash
# Lint JavaScript code
npm run lint

# Format code with Prettier
npm run format

# Type check (if using TypeScript)
npm run type-check
```

### Adding New Objects

1. Edit `public/assets/data/cosmic-objects.json`
2. Add object data with scientific measurements
3. Add sprite/texture to `public/assets/images/cosmic-objects/`
4. Document sources in `docs/DATA_SOURCES.md`

### Adding New Scale Levels

1. Edit `public/assets/data/scale-levels.json`
2. Define scale exponent and associated objects
3. Test zoom transitions

## Contributing

We welcome contributions from educators, developers, and scientists!

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Contribution Guidelines

- **Code Quality**: Follow existing code style, add comments for complex logic
- **Scientific Accuracy**: All data must include sources (see DATA_SOURCES.md)
- **Testing**: Add tests for new features
- **Documentation**: Update relevant documentation files

### Areas for Contribution

- 📊 **Data Curation**: Add more cosmic objects with accurate measurements
- 🎨 **Visual Assets**: Create sprites, textures, and UI elements
- 📚 **Educational Content**: Write facts, activities, and discussion prompts
- 🔧 **Features**: Implement new visualization modes
- 🌍 **Localization**: Translate to other languages
- 🧪 **Testing**: Add unit and integration tests

## Scientific Accuracy

All measurements and data are sourced from authoritative scientific databases and peer-reviewed literature. See [DATA_SOURCES.md](./docs/DATA_SOURCES.md) for complete references.

Key sources include:
- NASA Planetary Fact Sheets
- NIST Physical Constants Database
- International Astronomical Union (IAU)
- National Center for Biotechnology Information (NCBI)

## Performance

### Target Metrics

- ⚡ Initial load: < 3 seconds
- 🎬 Frame rate: Consistent 60 FPS
- 📦 Asset budget: < 25 MB total
- 🌐 Browser support: Chrome, Firefox, Safari, Edge (latest 2 versions)

### Optimization Strategies

- Lazy loading of object textures
- Object pooling for sprites
- Efficient scale calculations (cached results)
- Optimized animation system using Phaser tweens

## Deployment

An sftp deployment script is included for easy publishing to a web server.

## Browser Compatibility

| Browser | Minimum Version | Status |
|---------|----------------|--------|
| Chrome  | 90+            | ✅ Fully Supported |
| Firefox | 88+            | ✅ Fully Supported |
| Safari  | 14+            | ✅ Fully Supported |
| Edge    | 90+            | ✅ Fully Supported |

## Accessibility

Powers Explorer is designed with accessibility in mind:

- ⌨️ **Keyboard Navigation**: Full keyboard support for all interactions
- 🔊 **Screen Reader**: Compatible with ARIA labels and semantic HTML
- 🎨 **High Contrast**: Adjustable contrast settings
- 📱 **Responsive**: Adapts to different screen sizes (desktop focus)

## Roadmap

### Version 1.0 (Current)
- 🔲 Cosmic Object Comparison Mode
- 🔲 15-30 preset cosmic objects
- 🔲 Educational facts and descriptions

### Version 1.1 (Planned)
- 🔲 Powers of Ten Explorer Mode
- 🔲 61 scale levels (10^-35 to 10^26)
- 🔲 Geometric Growth Visualizer
- 🔲 Enhanced accessibility features
- 🔲 Mobile/tablet support
- 🔲 Multi-language support



## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

### Inspiration
- **Powers of Ten** (1977) by Charles and Ray Eames - The original short film that inspired this project
- **Cosmic View** (1957) by Kees Boeke - Historical precedent for scale visualization
- **Scale of the Universe** by Cary and Michael Huang - Modern interactive web implementation

### Scientific Advisors
- [To be added as project develops]

### Contributors
- [Your Name] - Project Creator
- [Contributors will be listed here]

## Contact

**Project Maintainer**: [Your Name]
- Email: [your.email@example.com]
- GitHub: [@yourusername](https://github.com/yourusername)

**Project Repository**: https://github.com/yourusername/powersExplorer

## Support

If you find this project useful for your teaching or learning:

- ⭐ Star the repository on GitHub
- 🐛 Report bugs via [GitHub Issues](https://github.com/yourusername/powersExplorer/issues)
- 💡 Suggest features or improvements
- 📢 Share with other educators and students

## Citation

If you use Powers Explorer in academic work, please cite:

```
[Your Name]. (2025). Powers Explorer: An Interactive Tool for Scale Visualization
in Mathematics Education. Retrieved from https://github.com/yourusername/powersExplorer
```

---

**Made with ❤️ for mathematics education**

*Helping students grasp the ungraspable, one order of magnitude at a time.*
