package service

import model.BrewCommandResult

/**
 * Mock implementation of CommandExecutor for testing
 * Returns predefined responses based on the command arguments
 */
class MockCommandExecutor : CommandExecutor {
    private val mockResponses =
        mapOf(
            // List packages
            "list --versions" to
                BrewCommandResult(
                    isSuccess = true,
                    output =
                        """
                        brotli 1.1.0
                        btop 1.4.4
                        c-ares 1.34.5
                        ca-certificates 2025-08-12
                        cowsay 3.8.4
                        exercism 3.5.7
                        icu4c@77 77.1
                        libnghttp2 1.66.0
                        libnghttp3 1.11.0
                        libngtcp2 1.15.0
                        node 24.6.0
                        python 3.12.0
                        git 2.44.0
                        """.trimIndent(),
                    exitCode = 0,
                ),
            // Package info
            "info node" to
                BrewCommandResult(
                    isSuccess = true,
                    output =
                        """
                        ==> node: stable 24.6.0 (bottled), HEAD
                        Platform built on V8 to build network applications
                        https://nodejs.org/
                        Installed
                        /opt/homebrew/Cellar/node/24.6.0 (2,467 files, 95.8MB) *
                        From: https://github.com/Homebrew/homebrew-core/blob/HEAD/Formula/n/node.rb
                        License: MIT
                        ==> Dependencies
                        Build: pkgconf ✘, python@3.13 ✘, llvm ✘
                        Required: brotli ✔, c-ares ✔, icu4c@77 ✔, libnghttp2 ✔, libnghttp3 ✔, libngtcp2 ✔, libuv ✔, openssl@3 ✔, simdjson ✔, sqlite ✔, uvwasi ✘, zstd ✔
                        ==> Options
                        --HEAD
                                Install HEAD version
                        ==> Analytics
                        install: 228,234 (30 days), 688,268 (90 days), 2,718,813 (365 days)
                        install-on-request: 194,865 (30 days), 588,258 (90 days), 2,335,743 (365 days)
                        build-error: 3,459 (30 days)
                        """.trimIndent(),
                    exitCode = 0,
                ),
            "info python" to
                BrewCommandResult(
                    isSuccess = true,
                    output =
                        """
                        ==> python: stable 3.12.0 (bottled), HEAD
                        Interpreted, interactive, object-oriented programming language
                        https://www.python.org/
                        Installed
                        /opt/homebrew/Cellar/python/3.12.0 (3,123 files, 56.2MB) *
                        From: https://github.com/Homebrew/homebrew-core/blob/HEAD/Formula/p/python.rb
                        License: Python-2.0
                        ==> Dependencies
                        Build: pkg-config ✔
                        Required: bzip2 ✔, libffi ✔, ncurses ✔, openssl@3 ✔, readline ✔, sqlite ✔, xz ✔, zlib ✔
                        ==> Options
                        --HEAD
                                Install HEAD version
                        ==> Analytics
                        install: 1,234,567 (30 days), 3,456,789 (90 days), 12,345,678 (365 days)
                        install-on-request: 987,654 (30 days), 2,345,678 (90 days), 8,765,432 (365 days)
                        build-error: 1,234 (30 days)
                        """.trimIndent(),
                    exitCode = 0,
                ),
            "info test-package" to
                BrewCommandResult(
                    isSuccess = true,
                    output =
                        """
                        ==> test-package: stable 1.0.0 (bottled), HEAD
                        A test package for unit testing
                        https://example.com/test-package
                        Installed
                        /opt/homebrew/Cellar/test-package/1.0.0 (10 files, 1.2MB) *
                        From: https://github.com/Homebrew/homebrew-core/blob/HEAD/Formula/t/test-package.rb
                        License: MIT
                        ==> Dependencies
                        Build: pkg-config ✔
                        Required: openssl@3 ✔, zlib ✔
                        ==> Options
                        --HEAD
                                Install HEAD version
                        ==> Analytics
                        install: 1,000 (30 days), 3,000 (90 days), 10,000 (365 days)
                        install-on-request: 800 (30 days), 2,400 (90 days), 8,000 (365 days)
                        build-error: 5 (30 days)
                        """.trimIndent(),
                    exitCode = 0,
                ),
            // Dependencies
            "deps node" to
                BrewCommandResult(
                    isSuccess = true,
                    output =
                        """
                        brotli
                        c-ares
                        ca-certificates
                        icu4c@77
                        libnghttp2
                        libnghttp3
                        libngtcp2
                        libuv
                        lz4
                        openssl@3
                        readline
                        simdjson
                        sqlite
                        xz
                        zstd
                        """.trimIndent(),
                    exitCode = 0,
                ),
            "deps test-package" to
                BrewCommandResult(
                    isSuccess = true,
                    output =
                        """
                        openssl@3
                        zlib
                        """.trimIndent(),
                    exitCode = 0,
                ),
            // Dependents
            "uses openssl@3" to
                BrewCommandResult(
                    isSuccess = true,
                    output =
                        """
                        node
                        python
                        git
                        curl
                        wget
                        """.trimIndent(),
                    exitCode = 0,
                ),
            "uses test-package" to
                BrewCommandResult(
                    isSuccess = true,
                    output =
                        """
                        some-other-package
                        another-package
                        """.trimIndent(),
                    exitCode = 0,
                ),
            // Search
            "search python" to
                BrewCommandResult(
                    isSuccess = true,
                    output =
                        """
                        ==> Formulae
                        boost-python3              python-gdbm@3.11           python-tk@3.10             python@3.8
                        bpython                    python-gdbm@3.12           python-tk@3.11             python@3.9
                        cyclonedx-python           python-gdbm@3.13           python-tk@3.12             reorder-python-imports
                        ipython                    python-launcher            python-tk@3.13             wxpython
                        libvirt-python             python-lsp-server          python-tk@3.9              cython
                        micropython                python-markdown            python-yq                  jython
                        ptpython                   python-matplotlib          python@3.10                pythran
                        python-argcomplete         python-packaging           python@3.11
                        python-build               python-setuptools          python@3.12
                        python-freethreading       python-tabulate            python@3.13

                        ==> Casks
                        mysql-connector-python

                        If you meant "python" specifically:
                        It was migrated from homebrew/cask to homebrew/core.
                        """.trimIndent(),
                    exitCode = 0,
                ),
            // Outdated
            "outdated" to
                BrewCommandResult(
                    isSuccess = true,
                    output =
                        """
                        ==> Downloading https://formulae.brew.sh/api/formula.jws.json
                        ==> Downloading https://formulae.brew.sh/api/cask.jws.json
                        """.trimIndent(),
                    exitCode = 0,
                ),
            // Doctor
            "doctor" to
                BrewCommandResult(
                    isSuccess = true,
                    output = "Your system is ready to brew.",
                    exitCode = 0,
                ),
            // Version
            "--version" to
                BrewCommandResult(
                    isSuccess = true,
                    output = "Homebrew 4.6.7",
                    exitCode = 0,
                ),
            // Update
            "update" to
                BrewCommandResult(
                    isSuccess = true,
                    output = "Updated Homebrew from abc123 to def456.",
                    exitCode = 0,
                ),
            // Upgrade
            "upgrade" to
                BrewCommandResult(
                    isSuccess = true,
                    output = "Upgraded 3 packages.",
                    exitCode = 0,
                ),
            // Install (success)
            "install test-package" to
                BrewCommandResult(
                    isSuccess = true,
                    output = "Successfully installed test-package",
                    exitCode = 0,
                ),
            // Uninstall (success)
            "uninstall test-package" to
                BrewCommandResult(
                    isSuccess = true,
                    output = "Successfully uninstalled test-package",
                    exitCode = 0,
                ),
            // Package commands
            "list --formula" to
                BrewCommandResult(
                    isSuccess = true,
                    output =
                        """
                        brotli
                        btop
                        c-ares
                        ca-certificates
                        cowsay
                        exercism
                        icu4c@77
                        libnghttp2
                        libnghttp3
                        libngtcp2
                        node
                        python
                        git
                        """.trimIndent(),
                    exitCode = 0,
                ),
            // Prefix
            "--prefix" to
                BrewCommandResult(
                    isSuccess = true,
                    output = "/opt/homebrew",
                    exitCode = 0,
                ),
        )

    override fun executeBrewCommand(
        args: List<String>,
        timeoutSeconds: Long,
    ): BrewCommandResult {
        val commandKey = args.joinToString(" ")

        return mockResponses[commandKey] ?: BrewCommandResult(
            isSuccess = false,
            output = "",
            errorMessage = "Mock command not found: brew $commandKey",
            exitCode = 1,
        )
    }

    override fun executeTldrCommand(
        command: String,
        timeoutSeconds: Long,
    ): BrewCommandResult {
        val mockTldrResponses =
            mapOf(
                "git" to
                    BrewCommandResult(
                        isSuccess = true,
                        output =
                            """
                            # git
                            
                            Distributed version control system.
                            
                            - Initialize a new local repository:
                                git init
                            
                            - Clone a repository:
                                git clone remote_repository
                            
                            - Add files to staging area:
                                git add file1 file2
                            
                            - Commit staged files:
                                git commit -m "commit message"
                            
                            - Show commit history:
                                git log
                            """.trimIndent(),
                        exitCode = 0,
                    ),
                "node" to
                    BrewCommandResult(
                        isSuccess = true,
                        output =
                            """
                            # node
                            
                            Node.js JavaScript runtime.
                            
                            - Run a JavaScript file:
                                node filename.js
                            
                            - Start REPL:
                                node
                            
                            - Evaluate code:
                                node -e "console.log('Hello World')"
                            """.trimIndent(),
                        exitCode = 0,
                    ),
            )

        return mockTldrResponses[command] ?: BrewCommandResult(
            isSuccess = false,
            output = "",
            errorMessage = "Mock tldr command not found: $command",
            exitCode = 1,
        )
    }
}
