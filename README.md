# npmdiff

> **[EN]** Compare two versions of any npm package side by side: bundle size delta, dependency count changes, and available version listing — all from the terminal.
> **[FR]** Comparez deux versions d'un paquet npm côte à côte : delta de taille du bundle, changements du nombre de dépendances et liste des versions disponibles — tout depuis le terminal.

---

## Features / Fonctionnalités

**[EN]**
- Fetches package metadata from the npm registry via `npm view`
- Downloads both versions as `.tgz` tarballs in temp directories
- Reports packed bundle size for each version and the exact byte/KB/MB difference
- Reports direct dependency count for each version
- Lists all published versions of any package with `--versions`
- Human-readable size formatting (B / KB / MB)
- Cleans up temp files automatically after comparison
- Fully programmatic API for use in scripts or CI checks

**[FR]**
- Récupère les métadonnées du paquet depuis le registre npm via `npm view`
- Télécharge les deux versions sous forme de tarballs `.tgz` dans des répertoires temp
- Rapporte la taille du bundle empaqueté pour chaque version et la différence exacte en octets/Ko/Mo
- Rapporte le nombre de dépendances directes pour chaque version
- Liste toutes les versions publiées d'un paquet avec `--versions`
- Formatage lisible des tailles (B / Ko / Mo)
- Supprime automatiquement les fichiers temporaires après la comparaison
- API entièrement programmable pour une utilisation dans des scripts ou vérifications CI

---

## Installation

```bash
npm install -g @idirdev/npmdiff
```

---

## CLI Usage / Utilisation CLI

```bash
# Compare two versions of a package (comparer deux versions d'un paquet)
npmdiff express 4.17.0 4.18.2

# Compare lodash versions (comparer des versions de lodash)
npmdiff lodash 4.17.19 4.17.21

# List all available versions of a package (lister toutes les versions disponibles)
npmdiff react --versions

# Show help (afficher l'aide)
npmdiff --help
```

### Example Output / Exemple de sortie

```
$ npmdiff express 4.17.0 4.18.2
Comparing express 4.17.0 vs 4.18.2...
Size: 208.4KB -> 214.7KB (+6.3KB)
Deps: 30 -> 31

$ npmdiff axios --versions
0.19.0
0.19.1
0.19.2
0.20.0
0.21.0
0.21.1
0.21.2
0.21.3
0.21.4
1.0.0
1.1.0
...
```

---

## API (Programmatic) / API (Programmation)

```js
const { getPackageInfo, getVersions, diffVersions, formatSize } = require('@idirdev/npmdiff');

// Get full package metadata from the registry (obtenir les métadonnées complètes depuis le registre)
const info = getPackageInfo('express');
console.log(info.version); // latest version string

// List all versions published for a package (lister toutes les versions publiées)
const versions = getVersions('lodash');
console.log(versions.slice(-5)); // ['4.17.17', '4.17.18', '4.17.19', '4.17.20', '4.17.21']

// Compare two versions (comparer deux versions)
const result = diffVersions('express', '4.17.0', '4.18.2');
// {
//   name: 'express', v1: '4.17.0', v2: '4.18.2',
//   size1: 213456, size2: 219832, sizeDiff: 6376,
//   deps1: 30, deps2: 31
// }
console.log(formatSize(result.sizeDiff)); // '6.2KB'

// Format raw byte counts (formater des octets bruts)
console.log(formatSize(512));      // '512B'
console.log(formatSize(2048));     // '2.0KB'
console.log(formatSize(1572864)); // '1.50MB'
```

---

## License

MIT © idirdev
