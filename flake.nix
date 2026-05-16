{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";

  outputs = { self, nixpkgs }:
    let
      forAllSystems = nixpkgs.lib.genAttrs nixpkgs.lib.systems.flakeExposed;
    in {
      packages = forAllSystems (system:
        let
          pkgs = import nixpkgs { inherit system; };
          manifest = builtins.fromJSON (builtins.readFile ./manifest.json);
          geckoId = manifest.browser_specific_settings.gecko.id;
          extDir = "share/mozilla/extensions/{ec8030f7-c20a-464f-9b0e-13a3a9e97384}";
        in {
          default = pkgs.stdenv.mkDerivation {
            pname = "firefox-block-js";
            version = manifest.version;
            src = self;
            nativeBuildInputs = [ pkgs.zip ];
            buildPhase = ''
              zip -r extension.xpi manifest.json background.js
            '';
            installPhase = ''
              mkdir -p $out/${extDir}
              cp extension.xpi $out/${extDir}/${geckoId}.xpi
            '';
          };
        }
      );
    };
}
