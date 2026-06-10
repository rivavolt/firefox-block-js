{
  description = "firefox-block-js — block JavaScript on a configurable domain list";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    nix-webext.url = "github:rivavolt/nix-webext";
  };

  outputs = { self, nixpkgs, nix-webext }:
    let
      forAllSystems = nixpkgs.lib.genAttrs [ "x86_64-linux" "aarch64-linux" "aarch64-darwin" ];
    in {
      packages = forAllSystems (system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
          manifest = builtins.fromJSON (builtins.readFile ./manifest.json);
        in
        # Firefox-only (declarativeNetRequest JS-blocking). No Chrome half, so no
        # CRX and no signing key at all — just the unsigned XPI (AMO-signed for
        # self-distribution in nixos-config).
        nix-webext.lib.mkBrowserExtension {
          inherit pkgs;
          pname = "firefox-block-js";
          version = manifest.version;
          chrome = false;
          src = self;
          files = [ "manifest.json" "background.js" ];
        });
    };
}
