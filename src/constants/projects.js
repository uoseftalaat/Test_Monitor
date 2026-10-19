export const DEFAULT_PROJECTS = [
  {
    id: 'arm',
    name: 'ARM',
    description: 'Asset & Resource Management Platform',
    repoUrl: 'https://github.com/Areeb-Innovative-Technologies/arm_test',
    layers: ['web', 'api', 'mobile']
  },
  {
    id: 'cadaa',
    name: 'Cadaa',
    description: 'Compliance & Digital Auditing Automation',
    repoUrl: 'https://github.com/Areeb-Innovative-Technologies/cadaa_test',
    layers: ['web', 'api', 'mobile']
  },
  {
    id: 'domo',
    name: 'Domo',
    description: 'Kuiper — Domo workspace',
    repoUrl: 'https://github.com/Areeb-Innovative-Technologies/kuiper_test',
    layers: ['web', 'api', 'mobile']
  },
  {
    id: 'dib',
    name: 'Dib',
    description: 'Kuiper — Dib workspace',
    repoUrl: 'https://github.com/Areeb-Innovative-Technologies/kuiper_test',
    layers: ['web', 'api', 'mobile']
  },
  {
    id: 'ibusiness',
    name: 'IBusiness',
    description: 'Kuiper — public landing & central auth/workspace picker',
    repoUrl: 'https://github.com/Areeb-Innovative-Technologies/kuiper_test',
    layers: ['web', 'api', 'mobile']
  },
  {
    id: 'atlas',
    name: 'Atlas',
    description: 'Enterprise Geolocation & Fleet Tracking',
    repoUrl: 'https://github.com/Areeb-Innovative-Technologies/atlas_test',
    layers: ['web', 'api', 'mobile']
  }
];

// Kuiper isn't a Firestore project of its own — domo/dib/ibusiness each sync
// independently (see kuiper_tests' CI). This just groups their nav tabs under
// one "Kuiper" parent, same visual pattern as a project's own layer tabs.
export const PROJECT_GROUPS = [
  {
    id: 'kuiper',
    name: 'Kuiper',
    description: 'Three apps (ibusiness, dib, domo) sharing one QA repo',
    repoUrl: 'https://github.com/Areeb-Innovative-Technologies/kuiper_test',
    members: ['ibusiness', 'dib', 'domo']
  }
];
