/**
 * Generate parameter and profile mappings from parameter.csv and profile.csv
 *
 * - Includes ALL parameters from parameter.csv (~1248)
 * - Includes ALL profiles from profile.csv (43)
 * - Uses parameterAliases.json for lab report name variations
 * - Unmapped parameters get SRA_P011+ with inferred profile
 *
 * Branded IDs: SRA_ prefix (Smart Report AI)
 * Run: npm run generate-mappings
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');

const testsDatabase = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, 'testsDatabase.json'), 'utf-8')
) as Record<string, { category?: string }>;

const profileDefinitions = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, 'profileDefinitions.json'), 'utf-8')
) as { profiles: Array<{ name: string; displayName: { en: string } }> };

let parameterAliases: Record<string, string[]> = {};
const aliasesPath = path.join(DATA_DIR, 'parameterAliases.json');
if (fs.existsSync(aliasesPath)) {
  const raw = JSON.parse(fs.readFileSync(aliasesPath, 'utf-8'));
  parameterAliases = raw.aliases ?? {};
}

const STANDARD_NAMES = Object.keys(testsDatabase);

const CATEGORY_TO_PROFILE: Record<string, string> = {
  'Complete Blood Count': 'complete_blood_count',
  'Lipid Profile': 'lipid_profile',
  'Liver Function Test': 'liver_function_test',
  'Kidney Function Test': 'kidney_function_test',
  'Thyroid Profile': 'thyroid_profile',
  'Diabetes Profile': 'diabetes_profile',
  'Vitamin Profile': 'vitamin_profile',
  'Iron Profile': 'iron_profile',
  'Electrolytes': 'electrolytes',
  'Cardiac Markers': 'cardiac_markers',
  'Hormone Profile (Male)': 'hormone_profile_male',
  'Hormone Profile (Female)': 'hormone_profile_female',
};

// Profile name variations (how labs may name profiles)
const PROFILE_VARIATIONS: Record<string, string[]> = {
  lipid_profile: ['lipid profile', 'lipid panel', 'lipid screen', 'lipids', 'cholesterol panel'],
  liver_function_test: ['liver profile', 'liver function', 'lft', 'liver panel', 'hepatic function'],
  kidney_function_test: ['kidney profile', 'kidney function', 'kft', 'renal profile', 'renal function'],
  thyroid_profile: ['thyroid profile', 'thyroid panel', 'thyroid function', 'tsh panel'],
  complete_blood_count: ['blood counts', 'cbc', 'complete blood count', 'haematology', 'hematology'],
  diabetes_profile: ['diabetes monitoring', 'diabetes profile', 'blood sugar panel', 'glucose profile'],
  vitamin_profile: ['vitamin profile', 'vitamins', 'vitamin panel'],
  electrolytes: ['electrolyte profile', 'electrolytes', 'serum electrolytes', 'electrolyte panel'],
  iron_profile: ['anemia studies', 'iron profile', 'iron studies', 'anemia profile'],
  cardiac_markers: ['cardiac profile', 'heart assure', 'cardiac panel', 'troponin'],
  hormone_profile_male: ['hormones', 'hormone profile', 'male hormones', 'reproductive hormones'],
  hormone_profile_female: ['female hormones', 'reproductive hormones'],
  allergy_panel: ['allergy panel', 'allergy', 'allergy test'],
  hepatitis: ['hepatitis', 'hepatitis profile', 'viral hepatitis'],
  std_profile: ['std profile', 'sexually transmitted', 'stds'],
  urinalysis: ['urinalysis', 'urine analysis', 'urine test'],
  coagulation: ['blood clotting', 'prothrombin', 'coagulation', 'pt', 'aptt'],
  autoimmune: ['autoimmune disorders', 'autoimmune', 'ana', 'rheumatoid'],
  infection: ['bacterial infections', 'viral infections', 'infectious diseases', 'infection panel'],
  inflammation: ['inflammation', 'crp', 'esr', 'inflammatory markers'],
  tumour_markers: ['tumour marker', 'tumor marker', 'cancer profile', 'cancer markers'],
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findStandardName(clientName: string): string | null {
  const n = normalize(clientName);

  // 1. HbA1c first (before Hemoglobin - "Glycosylated Haemoglobin" is HbA1c)
  if (/\b(hba1c|a1c|glycated|glycosylated\s*(haemoglobin|hemoglobin))/i.test(clientName)) {
    const hba1cAliases = parameterAliases['HbA1c'] ?? ['hba1c', 'glycosylated haemoglobin', 'glycated hemoglobin'];
    if (hba1cAliases.some((a) => n.includes(a) || n === a)) return 'HbA1c';
  }

  // 2. Check each standard's aliases
  const order = ['HbA1c', ...STANDARD_NAMES.filter((s) => s !== 'HbA1c')];
  for (const standard of order) {
    const aliases = parameterAliases[standard] ?? [];
    const standardNorm = normalize(standard);

    if (n === standardNorm || n.includes(standardNorm)) return standard;
    if (aliases.some((a) => n.includes(a) || n === a || normalize(a) === n)) return standard;

    // Standard as substring (min 5 chars to avoid "alt" in "alternaria")
    if (standardNorm.length >= 5 && n.includes(standardNorm)) return standard;
  }

  // 3. Exact standard name in client
  for (const std of STANDARD_NAMES) {
    if (n.includes(normalize(std)) && normalize(std).length >= 5) return std;
  }

  return null;
}

function inferProfileFromParamName(paramName: string): string {
  const n = normalize(paramName);

  const rules: Array<{ keywords: string[]; profile: string }> = [
    { keywords: ['allergy', 'allergen'], profile: 'sra_prof_allergy_panel' },
    { keywords: ['lipid', 'cholesterol', 'hdl', 'ldl', 'triglyceride', 'vldl'], profile: 'lipid_profile' },
    { keywords: ['sgpt', 'sgot', 'alt', 'ast', 'bilirubin', 'alkaline phosphatase', 'ggt', 'liver'], profile: 'liver_function_test' },
    { keywords: ['creatinine', 'urea', 'bun', 'egfr', 'kidney', 'renal'], profile: 'kidney_function_test' },
    { keywords: ['tsh', 't3', 't4', 'thyroid', 'thyroglobulin', 'anti-tpo'], profile: 'thyroid_profile' },
    { keywords: ['glucose', 'hba1c', 'insulin', 'c-peptide', 'fructosamine', 'diabetes'], profile: 'diabetes_profile' },
    { keywords: ['hemoglobin', 'haemoglobin', 'rbc', 'wbc', 'platelet', 'neutrophil', 'lymphocyte', 'mcv', 'mch', 'esr', 'hematocrit', 'haematocrit'], profile: 'complete_blood_count' },
    { keywords: ['vitamin d', 'vitamin b12', 'folate', 'vitamin a', 'vitamin e', 'vitamin c'], profile: 'vitamin_profile' },
    { keywords: ['iron', 'ferritin', 'tibc', 'transferrin', 'anemia'], profile: 'iron_profile' },
    { keywords: ['sodium', 'potassium', 'chloride', 'bicarbonate', 'electrolyte'], profile: 'electrolytes' },
    { keywords: ['troponin', 'ck-mb', 'bnp', 'cardiac', 'heart'], profile: 'cardiac_markers' },
    { keywords: ['testosterone', 'estradiol', 'progesterone', 'fsh', 'lh', 'prolactin', 'dhea', 'amh', 'shbg'], profile: 'hormone_profile_male' },
    { keywords: ['hepatitis', 'hbsag', 'hcv', 'hav'], profile: 'sra_prof_hepatitis' },
    { keywords: ['covid', 'sars'], profile: 'sra_prof_covid' },
    { keywords: ['pt', 'aptt', 'inr', 'd-dimer', 'fibrinogen', 'coagulation', 'clotting'], profile: 'sra_prof_blood_clotting' },
    { keywords: ['ana', 'rheumatoid', 'autoimmune', 'dsdna', 'complement'], profile: 'sra_prof_autoimmune_disorders' },
    { keywords: ['tumour', 'tumor', 'cea', 'psa', 'afp', 'ca-125', 'ca 19-9'], profile: 'sra_prof_cancer_profile' },
    { keywords: ['stool', 'ocult', 'helminth'], profile: 'sra_prof_stool_analysis' },
    { keywords: ['urine', 'urinalysis', 'microalbumin'], profile: 'sra_prof_urinalysis' },
    { keywords: ['blood group', 'abo', 'rh'], profile: 'sra_prof_blood_group' },
    { keywords: ['semen', 'sperm'], profile: 'sra_prof_semen_analysis' },
  ];

  for (const { keywords, profile } of rules) {
    if (keywords.some((k) => n.includes(k))) return profile;
  }

  return 'other_tests';
}

function main() {
  const paramCsv = fs.readFileSync(path.join(DATA_DIR, 'parameter.csv'), 'utf-8');
  const paramLines = paramCsv.split('\n').map((l) => l.trim());
  const paramNames = paramLines.slice(1).filter(Boolean);

  const profileCsv = fs.readFileSync(path.join(DATA_DIR, 'profile.csv'), 'utf-8');
  const profileLines = profileCsv.split('\n').map((l) => l.trim());
  const profileNames = profileLines.slice(1).filter(Boolean);

  // 1. Param IDs: SRA_P001..P010 for standards, SRA_P011+ for others
  const standardToParamId: Record<string, string> = {};
  let paramCounter = 1;
  for (const std of STANDARD_NAMES) {
    standardToParamId[std] = `SRA_P${String(paramCounter).padStart(3, '0')}`;
    paramCounter++;
  }

  const parameterNameMapping: Record<string, { standardName: string; paramId: string }> = {};
  const paramIdToProfile: Record<string, string> = {};
  const usedParamIds = new Set<string>(Object.values(standardToParamId));

  // 2. Add ALL parameters from CSV
  for (const clientName of paramNames) {
    const trimmed = clientName.replace(/^"|"$/g, '').split('~')[0].trim();
    if (!trimmed) continue;

    const standardName = findStandardName(trimmed);
    let paramId: string;
    let profileId: string;

    if (standardName) {
      paramId = standardToParamId[standardName];
      const cat = testsDatabase[standardName]?.category;
      profileId = cat ? (CATEGORY_TO_PROFILE[cat] ?? 'other_tests') : 'other_tests';
    } else {
      if (!usedParamIds.has(`SRA_P${String(paramCounter).padStart(3, '0')}`)) {
        paramId = `SRA_P${String(paramCounter).padStart(3, '0')}`;
        paramCounter++;
        usedParamIds.add(paramId);
      } else {
        paramId = `SRA_P${String(paramCounter).padStart(3, '0')}`;
        paramCounter++;
      }
      profileId = inferProfileFromParamName(trimmed);
      // Use trimmed as standardName for unmapped (display as-is)
    }

    parameterNameMapping[trimmed] = {
      standardName: standardName ?? trimmed,
      paramId,
    };
    paramIdToProfile[paramId] = profileId;
  }

  // 3. Add standard self-mappings
  for (const std of STANDARD_NAMES) {
    if (!parameterNameMapping[std]) {
      parameterNameMapping[std] = { standardName: std, paramId: standardToParamId[std] };
    }
    paramIdToProfile[standardToParamId[std]] =
      CATEGORY_TO_PROFILE[testsDatabase[std]?.category ?? ''] ?? 'other_tests';
  }

  // 4. Add EXTRA name variations (common lab report formats)
  const extraVariations: Array<[string, string]> = [
    ['Hb', 'Hemoglobin'],
    ['Hgb', 'Hemoglobin'],
    ['HB', 'Hemoglobin'],
    ['FBS', 'Blood Glucose Fasting'],
    ['FBG', 'Blood Glucose Fasting'],
    ['Sr. Creatinine', 'Creatinine'],
    ['Creatinine, Serum', 'Creatinine'],
    ['Total Chol', 'Total Cholesterol'],
    ['HDL-C', 'HDL Cholesterol'],
    ['LDL-C', 'LDL Cholesterol'],
    ['TG', 'Triglycerides'],
    ['TC', 'Total Cholesterol'],
    ['ALT', 'SGPT (ALT)'],
    ['HbA1C', 'HbA1c'],
    ['Glycosylated Hb', 'HbA1c'],
    ['Blood Sugar (Fasting)', 'Blood Glucose Fasting'],
    ['Fasting Blood Sugar', 'Blood Glucose Fasting'],
    ['Fasting Glucose', 'Blood Glucose Fasting'],
    ['RBS', 'Blood Glucose Fasting'],
    ['Post Prandial Glucose', 'Blood Glucose Fasting'],
    ['PP Blood Sugar', 'Blood Glucose Fasting'],
    ['Random Blood Sugar', 'Blood Glucose Fasting'],
  ];

  for (const [variation, standardName] of extraVariations) {
    if (!parameterNameMapping[variation] && STANDARD_NAMES.includes(standardName)) {
      parameterNameMapping[variation] = {
        standardName,
        paramId: standardToParamId[standardName],
      };
    }
  }

  // 5. Profile mapping - ALL profiles from profile.csv + variations
  const profileNameToId: Record<string, string> = {};
  const profileAliases: Record<string, string> = {
    'Lipid Profile': 'lipid_profile',
    'Liver Profile': 'liver_function_test',
    'Kidney Profile': 'kidney_function_test',
    'Thyroid Profile': 'thyroid_profile',
    'Blood Counts': 'complete_blood_count',
    'Diabetes Monitoring': 'diabetes_profile',
    'Vitamin Profile': 'vitamin_profile',
    'Electrolyte Profile': 'electrolytes',
    'Anemia Studies': 'iron_profile',
    'Cardiac Profile': 'cardiac_markers',
    'Hormones': 'hormone_profile_male',
    'Inflammation': 'other_tests',
    'Allergy Panel': 'sra_prof_allergy_panel',
    'Blood Clotting': 'sra_prof_blood_clotting',
    'Blood Disorder': 'sra_prof_blood_disorder',
    'Blood Group': 'sra_prof_blood_group',
    'Bone Health': 'sra_prof_bone_health',
    'Cancer Profile': 'sra_prof_cancer_profile',
    'COVID': 'sra_prof_covid',
    'Heart Assure': 'cardiac_markers',
    'Hemoglobin Electrophoresis': 'sra_prof_hemoglobin_electrophoresis',
    'Hepatitis': 'sra_prof_hepatitis',
    'Hypertension': 'sra_prof_hypertension',
    'Immunity': 'sra_prof_immunity',
    'Infectious Diseases': 'sra_prof_infectious_diseases',
    'Malaria Profile': 'sra_prof_malaria_profile',
    'Mineral Profile': 'sra_prof_mineral_profile',
    'Neurological Disorders': 'sra_prof_neurological_disorders',
    'Pancreas': 'sra_prof_pancreas',
    'Prothrombin Time': 'sra_prof_prothrombin_time',
    'Semen Analysis': 'sra_prof_semen_analysis',
    'Semen Culture and Sensitivity': 'sra_prof_semen_culture_and_sensitivity',
    'STD Profile': 'sra_prof_std_profile',
    'Stool Analysis': 'sra_prof_stool_analysis',
    'Toxic elements': 'sra_prof_toxic_elements',
    'Tumour Marker Test': 'sra_prof_tumour_marker_test',
    'Urinalysis': 'sra_prof_urinalysis',
    'Viral Infections': 'sra_prof_viral_infections',
    'Arthritis Screening': 'sra_prof_arthritis_screening',
    'Autoimmune Disorders': 'sra_prof_autoimmune_disorders',
    'Bacterial Infections': 'sra_prof_bacterial_infections',
    'BMI & BP': 'sra_prof_bmi_bp',
  };

  for (const profName of profileNames) {
    const trimmed = profName.trim();
    const n = normalize(trimmed);

    const found = profileDefinitions.profiles.find(
      (p) =>
        normalize(p.displayName.en) === n ||
        n.includes(normalize(p.displayName.en)) ||
        normalize(p.displayName.en).includes(n)
    );
    if (found) {
      profileNameToId[trimmed] = found.name;
    } else if (profileAliases[trimmed]) {
      profileNameToId[trimmed] = profileAliases[trimmed];
    } else {
      profileNameToId[trimmed] = `sra_prof_${n.replace(/\s+/g, '_')}`;
    }
  }

  // Add profile display name variations
  const profileVariationEntries: Array<[string, string]> = [
    ['Lipid Panel', 'lipid_profile'],
    ['Lipid Screen', 'lipid_profile'],
    ['Liver Function Test', 'liver_function_test'],
    ['LFT', 'liver_function_test'],
    ['Kidney Function Test', 'kidney_function_test'],
    ['KFT', 'kidney_function_test'],
    ['Renal Profile', 'kidney_function_test'],
    ['Complete Blood Count', 'complete_blood_count'],
    ['CBC', 'complete_blood_count'],
    ['Blood Count', 'complete_blood_count'],
    ['Diabetes Profile', 'diabetes_profile'],
    ['Thyroid Panel', 'thyroid_profile'],
    ['Thyroid Function', 'thyroid_profile'],
    ['Electrolytes', 'electrolytes'],
    ['Electrolyte Panel', 'electrolytes'],
    ['Iron Studies', 'iron_profile'],
    ['Iron Panel', 'iron_profile'],
    ['Cardiac Markers', 'cardiac_markers'],
    ['Cardiac Panel', 'cardiac_markers'],
    ['Hormone Profile (Male)', 'hormone_profile_male'],
    ['Hormone Profile (Female)', 'hormone_profile_female'],
  ];
  for (const [variation, id] of profileVariationEntries) {
    profileNameToId[variation] = id;
  }

  for (const p of profileDefinitions.profiles) {
    profileNameToId[p.displayName.en] = p.name;
  }

  // 6. parameterProfileMapping
  const parameterProfileMapping: Record<string, string> = { ...paramIdToProfile };

  // Write outputs
  fs.writeFileSync(
    path.join(DATA_DIR, 'parameterNameMapping.json'),
    JSON.stringify(parameterNameMapping, null, 2),
    'utf-8'
  );
  fs.writeFileSync(
    path.join(DATA_DIR, 'profileNameMapping.json'),
    JSON.stringify(profileNameToId, null, 2),
    'utf-8'
  );
  fs.writeFileSync(
    path.join(DATA_DIR, 'parameterProfileMapping.json'),
    JSON.stringify(parameterProfileMapping, null, 2),
    'utf-8'
  );

  const combinedMapping = {
    version: 2,
    description: 'Smart Report AI - All parameters and profiles. Includes lab report name variations.',
    parameterNameMapping,
    parameterProfileMapping,
    profileNameMapping: profileNameToId,
  };
  fs.writeFileSync(
    path.join(DATA_DIR, 'unifiedMapping.json'),
    JSON.stringify(combinedMapping, null, 2),
    'utf-8'
  );

  console.log('Generated mappings:');
  console.log(`  - parameterNameMapping.json: ${Object.keys(parameterNameMapping).length} entries`);
  console.log(`  - profileNameMapping.json: ${Object.keys(profileNameToId).length} entries`);
  console.log(`  - parameterProfileMapping.json: ${Object.keys(parameterProfileMapping).length} param IDs`);
  console.log(`  - All ${paramNames.length} parameters from CSV included`);
  console.log(`  - All ${profileNames.length} profiles from CSV included`);
}

main();
