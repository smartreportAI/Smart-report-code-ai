/**
 * MappingService - Name-based parameter and profile mappings
 *
 * Uses branded SRA IDs (SRA_P001, SRA_PROF_LIPID, etc.) - our own IDs,
 * not client/LIS IDs, to avoid exposing competitor product references.
 *
 * Data sources:
 * - parameterNameMapping.json: client name → { standardName, paramId }
 * - profileNameMapping.json: profile display name → profileId
 * - parameterProfileMapping.json: paramId → profileId
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ParameterMapping {
  standardName: string;
  paramId: string;
}

export interface MappingData {
  parameterNameMapping: Record<string, ParameterMapping>;
  profileNameMapping: Record<string, string>;
  parameterProfileMapping: Record<string, string>;
}

export class MappingService {
  private static instance: MappingService;
  private data: MappingData | null = null;
  private readonly dataPath: string;

  constructor() {
    this.dataPath = path.join(process.cwd(), 'src', 'data');
  }

  static getInstance(): MappingService {
    if (!MappingService.instance) {
      MappingService.instance = new MappingService();
    }
    return MappingService.instance;
  }

  private load(): MappingData {
    if (this.data) return this.data;

    const unifiedPath = path.join(this.dataPath, 'unifiedMapping.json');
    if (!fs.existsSync(unifiedPath)) {
      this.data = {
        parameterNameMapping: {},
        profileNameMapping: {},
        parameterProfileMapping: {},
      };
      return this.data;
    }

    const raw = JSON.parse(fs.readFileSync(unifiedPath, 'utf-8'));
    this.data = {
      parameterNameMapping: raw.parameterNameMapping ?? {},
      profileNameMapping: raw.profileNameMapping ?? {},
      parameterProfileMapping: raw.parameterProfileMapping ?? {},
    };
    return this.data;
  }

  /** Normalize for matching: lowercase, collapse spaces, remove extra punctuation */
  private normalizeKey(s: string): string {
    return (s ?? '')
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Resolve client parameter name to standard name and branded param ID */
  resolveParameter(clientName: string): ParameterMapping | null {
    const name = (clientName ?? '').trim();
    if (!name) return null;

    const { parameterNameMapping } = this.load();

    // Exact match
    if (parameterNameMapping[name]) {
      return parameterNameMapping[name];
    }

    // Case-insensitive match
    const nameLower = name.toLowerCase();
    for (const [key, val] of Object.entries(parameterNameMapping)) {
      if (key.toLowerCase() === nameLower) return val;
    }

    // Normalized match (handles "Serum  Creatinine", "SERUM CREATININE", "Creatinine, Serum")
    const nameNorm = this.normalizeKey(name);
    if (nameNorm) {
      for (const [key, val] of Object.entries(parameterNameMapping)) {
        if (this.normalizeKey(key) === nameNorm) return val;
      }
    }

    return null;
  }

  /** Resolve profile display name to profileId */
  resolveProfile(profileName: string): string | null {
    const name = (profileName ?? '').trim();
    if (!name) return null;

    const { profileNameMapping } = this.load();

    if (profileNameMapping[name]) return profileNameMapping[name];

    const nameLower = name.toLowerCase();
    for (const [key, val] of Object.entries(profileNameMapping)) {
      if (key.toLowerCase() === nameLower) return val;
    }

    const nameNorm = this.normalizeKey(name);
    if (nameNorm) {
      for (const [key, val] of Object.entries(profileNameMapping)) {
        if (this.normalizeKey(key) === nameNorm) return val;
      }
    }

    return null;
  }

  /** Get profileId for a branded param ID */
  getProfileForParameter(paramId: string): string | null {
    const id = (paramId ?? '').trim();
    if (!id) return null;

    const { parameterProfileMapping } = this.load();
    return parameterProfileMapping[id] ?? null;
  }

  /** Get standard name for a client parameter name (convenience) */
  getStandardName(clientName: string): string | null {
    const mapping = this.resolveParameter(clientName);
    return mapping?.standardName ?? null;
  }

  /** Get branded param ID for a client parameter name (convenience) */
  getParamId(clientName: string): string | null {
    const mapping = this.resolveParameter(clientName);
    return mapping?.paramId ?? null;
  }

  /** Reload mappings from disk (e.g. after regeneration) */
  reload(): void {
    this.data = null;
    this.load();
  }
}
