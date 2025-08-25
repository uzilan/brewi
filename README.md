# Brewi

A modern web application for managing Homebrew packages on macOS. Brewi provides an intuitive interface for viewing, searching, installing, and managing your Homebrew packages with real-time information and documentation.

## Features

### 📦 Package Management
- **View Installed Packages**: See all your installed Homebrew packages with detailed information
- **Package Details**: View dependencies, dependents, available commands, and command output
- **Search & Install**: Search for new packages and install them directly from the interface
- **Uninstall Packages**: Remove packages with a single click

### 🔧 System Maintenance
- **Update & Upgrade**: Keep your Homebrew and packages up to date
- **Doctor**: Run Homebrew doctor to diagnose and fix common issues
- **Real-time Status**: See when packages were last updated

### 📚 Documentation
- **Command Documentation**: Click on any command to see its `tldr` documentation
- **Syntax Highlighting**: Beautiful code formatting for command output and documentation
- **Interactive TOC**: Navigate quickly between sections with the table of contents

### ⚡ Performance
- **Smart Caching**: Client-side caching for fast navigation
- **Background Prefetching**: Load package information in the background
- **Responsive Design**: Works great on desktop and mobile devices

## Tech Stack

### Frontend
- **React** - Modern UI framework
- **Material-UI (MUI)** - Beautiful, accessible components
- **Zustand** - Lightweight state management
- **React Syntax Highlighter** - Code formatting

### Backend
- **Kotlin** - Modern JVM language
- **Ktor** - Lightweight web framework
- **Gradle** - Build system

## Getting Started

### Prerequisites
- macOS with Homebrew installed
- Java 17 or later
- Node.js 16 or later

### Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:uzilan/brewi.git
   cd brewi
   ```

2. **Start the backend server**
   ```bash
   cd backend
   ./gradlew run
   ```
   The backend will start on `http://localhost:8080`

3. **Start the frontend development server**
   ```bash
   cd frontend
   npm install
   npm start
   ```
   The frontend will start on `http://localhost:3000`

4. **Open your browser**
   Navigate to `http://localhost:3000` to start using Brewi

## Usage

### Viewing Packages
- The main page shows all your installed Homebrew packages
- Click on any package to see detailed information
- Use the filter to search through your packages

### Installing New Packages
1. Click the "Search" button in the top toolbar
2. Enter the package name you want to install
3. Click "Install" next to the desired package

### Package Details
When you click on a package, you'll see:
- **Dependencies**: Packages this package depends on
- **Dependents**: Packages that depend on this package
- **Command Output**: The output of `brew info [package]`
- **Available Commands**: Commands provided by this package
- **Documentation**: Click any command to see its `tldr` documentation

### System Maintenance
- **Update & Upgrade**: Click the "Update & Upgrade" button to update Homebrew and all packages
- **Doctor**: Click "Doctor" to run Homebrew's diagnostic tool

## Development

### Project Structure
```
brewi/
├── backend/                 # Kotlin/Ktor backend
│   ├── src/main/kotlin/
│   │   ├── ApplicationServer.kt
│   │   ├── controller/      # API endpoints
│   │   ├── model/          # Data models
│   │   └── service/        # Business logic
│   └── src/main/resources/
│       └── openapi/        # API documentation
└── frontend/               # React frontend
    ├── src/
    │   ├── services/       # API service modules
    │   ├── stores/         # Zustand state stores
    │   └── components/     # React components
    └── public/
```

### API Endpoints
- `GET /api/packages` - List all installed packages
- `GET /api/packages/{name}` - Get package information
- `GET /api/packages/{name}/commands` - Get package commands
- `GET /api/tldr/{command}` - Get command documentation
- `POST /api/packages/{name}/install` - Install a package
- `DELETE /api/packages/{name}` - Uninstall a package
- `POST /api/brew/update` - Update Homebrew
- `POST /api/brew/upgrade` - Upgrade all packages
- `POST /api/brew/doctor` - Run Homebrew doctor

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- [Homebrew](https://brew.sh/) - The package manager for macOS
- [tldr](https://tldr.sh/) - Simplified and community-driven man pages
- [Material-UI](https://mui.com/) - React UI framework
- [Ktor](https://ktor.io/) - Kotlin web framework
