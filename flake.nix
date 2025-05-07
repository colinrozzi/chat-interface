{
  description = "chat-interface - A Theater actor";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    flake-utils.url = "github:numtide/flake-utils";
    
    # Add cargo-component source
    cargo-component-src = {
      url = "github:bytecodealliance/cargo-component/v0.21.1";
      flake = false;
    };
  };


  outputs = { self, nixpkgs, rust-overlay, flake-utils, cargo-component-src, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        overlays = [ (import rust-overlay) ];
        pkgs = import nixpkgs {
          inherit system overlays;
        };
        
        rustToolchain = pkgs.rust-bin.stable.latest.default.override {
          extensions = [ "rust-src" "rust-analyzer" ];
          targets = [ "wasm32-unknown-unknown" "wasm32-wasip1" ];
        };
        
        # Build cargo-component
        cargo-component = pkgs.rustPlatform.buildRustPackage {
          pname = "cargo-component";
          version = "0.21.1";
          src = cargo-component-src;
          
          cargoLock = {
            lockFile = pkgs.runCommand "cargo-component-Cargo.lock" {} ''
              cp ${cargo-component-src}/Cargo.lock $out
            '';
          };
          
          buildInputs = with pkgs; [
            openssl
            pkg-config
          ] ++ pkgs.lib.optionals pkgs.stdenv.isDarwin [
            pkgs.darwin.apple_sdk.frameworks.Security
            pkgs.darwin.apple_sdk.frameworks.SystemConfiguration
          ];
          
          # Skip tests during build
          doCheck = false;
        };

        toml = pkgs.lib.importTOML ./Cargo.toml;
        crateName = toml.package.name;

      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            rustToolchain
            pkg-config
            openssl
            # Pre-built cargo-component
            cargo-component
            # Tools for WebAssembly development
            wasmtime
            binaryen
            wasm-tools
            # Development tools
            rustfmt
            clippy
            # Frontend build tools
            esbuild
            nodejs
            # Added for TypeScript
            nodePackages.typescript
          ];

          RUST_SRC_PATH = "${rustToolchain}/lib/rustlib/src/rust/library";
          # Set SSL certificates path
          SSL_CERT_FILE = "${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt";
          NIX_SSL_CERT_FILE = "${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt";
        };

        packages.default = pkgs.stdenv.mkDerivation {
          pname = "chat-interface";
          version = "0.1.0";
          src = ./.;

          nativeBuildInputs = with pkgs; [ 
            rustToolchain
            pkg-config 
            wasm-tools
            binaryen
            cargo-component
            cacert
            rustup
            esbuild
            nodejs
            nodePackages.typescript  # Added TypeScript
          ];
          
          buildInputs = with pkgs; [ 
            openssl
          ];

          buildPhase = ''
            echo "Building ${crateName}..."
            # Create cache directories
            export HOME=$TMPDIR
            export CARGO_HOME=$TMPDIR/cargo
            export XDG_CACHE_HOME=$TMPDIR/cache
            export CARGO_COMPONENT_CACHE_DIR=$TMPDIR/cargo-component-cache
            mkdir -p $CARGO_HOME $XDG_CACHE_HOME $CARGO_COMPONENT_CACHE_DIR

            # Create dist directory
            mkdir -p assets/dist build
            
            # Install frontend dependencies including TypeScript
            cd assets
            echo "Installing npm dependencies..."
            npm install --no-audit --no-fund --loglevel=error
            
            # Run TypeScript type checking
            echo "Running TypeScript type checking..."
            npx tsc --noEmit
            
            # Bundle the TypeScript with esbuild
            echo "Bundling TypeScript with esbuild..."
            npx esbuild src/index.ts \
              --bundle \
              --minify \
              --sourcemap \
              --outfile=dist/bundle.js \
              --target=es2020 \
              --format=esm \
              --platform=browser
            
            # Return to main directory
            cd ..
            
            # Ensure SSL certificates are available
            export SSL_CERT_FILE=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt
            export NIX_SSL_CERT_FILE=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt
            
            # Build the WebAssembly component
            cargo component build --release --target wasm32-unknown-unknown 
          '';

          installPhase = ''
            mkdir -p $out/lib
            wasmFile=$(ls target/wasm32-unknown-unknown/release/*.wasm)
            cp $wasmFile $out/lib/component.wasm
            
            # Copy frontend assets to output
            mkdir -p $out/assets
            cp -r assets/dist $out/assets/
            cp assets/index.html $out/assets/
            cp assets/styles.css $out/assets/
          '';
          
          # No longer need network access during build
          __noChroot = false;
        };
          checks.default = pkgs.stdenv.mkDerivation {
          name = "chat-interface-checks";
          src = ./.;

          nativeBuildInputs = with pkgs; [
            rustToolchain
            cargo-component
            pkg-config
            openssl
            nodejs
            nodePackages.typescript
            esbuild
            clippy
            rustfmt
          ];

          buildPhase = ''
            export HOME=$TMPDIR
            export CARGO_HOME=$TMPDIR/cargo
            export XDG_CACHE_HOME=$TMPDIR/cache

            # Ensure SSL certificates are available
            export SSL_CERT_FILE=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt
            export NIX_SSL_CERT_FILE=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt

            echo "Running cargo check..."
            cargo check --target wasm32-unknown-unknown

            # echo "Running clippy..."
            # cargo clippy --all-targets -- -D warnings

            echo "Checking TypeScript..."
            cd assets
            npm install --no-audit --no-fund --loglevel=error
            npx tsc --noEmit
            cd ..
          '';

          installPhase = ''
            mkdir -p $out
            '';
        };

      });

}
