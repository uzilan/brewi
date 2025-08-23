# Brewanator Backend

A Kotlin backend project using Gradle with Kotlin DSL.

## Requirements

- JDK 24 (for compilation)
- Gradle 9.0+ (automatically managed via Gradle Wrapper)

## Project Structure

```
backend/
├── build.gradle.kts          # Main build configuration
├── settings.gradle.kts       # Project settings
├── gradlew                   # Gradle wrapper script
├── gradlew.bat              # Gradle wrapper script (Windows)
├── gradle/                   # Gradle wrapper files
├── src/
│   ├── main/
│   │   ├── kotlin/          # Kotlin source files
│   │   └── resources/       # Resource files
│   └── test/
│       ├── kotlin/          # Kotlin test files
│       └── resources/       # Test resource files
└── README.md                # This file
```

## Configuration

- **Kotlin Version**: 2.0.0
- **JVM Target**: 22 (highest supported by Kotlin 2.0.0)
- **Java Toolchain**: JDK 24 (for compilation)
- **Build System**: Gradle with Kotlin DSL

## Building

```bash
./gradlew build
```

## Running

```bash
./gradlew run
```

## Testing

```bash
./gradlew test
```

## Development

The project is configured to use:
- Kotlin 2.0.0 with latest features
- JUnit 5 for testing
- Gradle application plugin for easy execution
- Proper toolchain configuration for consistent builds
