val ktorVersion = "3.2.3"

plugins {
    kotlin("jvm") version "2.2.10"
    application
    id("org.jlleitschuh.gradle.ktlint") version "12.1.0"
    jacoco
    id("com.github.node-gradle.node") version "7.1.0"
}

group = "com.brewanator"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(24))
    }
}

dependencies {
    implementation("io.ktor:ktor-server-core:$ktorVersion")
    implementation("io.ktor:ktor-server-netty:$ktorVersion")
    implementation("io.ktor:ktor-server-content-negotiation:$ktorVersion")
    implementation("io.ktor:ktor-serialization-jackson:$ktorVersion")
    implementation("io.ktor:ktor-server-swagger:$ktorVersion")
    implementation("io.ktor:ktor-server-cors:$ktorVersion")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")

    // Logging
    implementation("ch.qos.logback:logback-classic:1.4.11")
    implementation("io.github.microutils:kotlin-logging-jvm:3.0.5")

    // Caching
    implementation("com.github.ben-manes.caffeine:caffeine:3.1.8")

    testImplementation(kotlin("test"))
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.0")
    testImplementation("org.assertj:assertj-core:3.24.2")
    testImplementation("io.mockk:mockk:1.13.8")
    // Ktor testing
    testImplementation("io.ktor:ktor-server-test-host:$ktorVersion")
    testImplementation("io.ktor:ktor-client-content-negotiation:$ktorVersion")
    testImplementation("io.ktor:ktor-serialization-jackson:$ktorVersion")
}

tasks.test {
    useJUnitPlatform()
}

tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile> {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_24)
    }
}

tasks.withType<JavaCompile> {
    targetCompatibility = "24"
    sourceCompatibility = "24"
}

// Configure ktlint
configure<org.jlleitschuh.gradle.ktlint.KtlintExtension> {
    version.set("1.2.1")
    android.set(false)
    verbose.set(true)
    filter {
        exclude { element -> element.file.path.contains("build/") }
    }
}

application {
    mainClass.set("ApplicationServer")
}

// Node.js configuration
node {
    version.set("20.11.0")
    npmVersion.set("10.2.4")
    download.set(true)
    workDir.set(file("${layout.buildDirectory}/nodejs"))
    npmWorkDir.set(file("${layout.buildDirectory}/npm"))
    nodeProjectDir.set(file("../frontend"))
}

// Task to build the frontend using npm
tasks.register<Exec>("buildFrontend") {
    dependsOn("npm_install")
    workingDir = file("../frontend")
    commandLine("npm", "run", "build")
}

// Task to copy frontend build files to backend resources
tasks.register<Copy>("copyFrontendBuild") {
    dependsOn("buildFrontend")
    from("../frontend/build")
    into("src/main/resources/static")
    include("**/*")
}

// Make the jar task depend on copying frontend files
tasks.named("jar") {
    dependsOn("copyFrontendBuild")
}

// Make the run task depend on copying frontend files
tasks.named("run") {
    dependsOn("copyFrontendBuild")
}

// Make processResources depend on copyFrontendBuild
tasks.named("processResources") {
    dependsOn("copyFrontendBuild")
}

// JaCoCo configuration
jacoco {
    toolVersion = "0.8.13"
}

tasks.jacocoTestReport {
    reports {
        xml.required.set(true)
        html.required.set(true)
        csv.required.set(false)
    }
}

tasks.jacocoTestCoverageVerification {
    violationRules {
        rule {
            limit {
                minimum = "0.3".toBigDecimal()
            }
        }
    }
}
