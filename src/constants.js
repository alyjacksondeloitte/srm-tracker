export const WS = [
  { id:'annual',      label:'Annual Risk Refresh',          color:'#86BC25' },
  { id:'scenario',    label:'Scenario Exercise',            color:'#00A3E0' },
  { id:'playbook',    label:'SRM Playbook',                 color:'#7B68EE' },
  { id:'kri',         label:'KRI Development',              color:'#FB8C00' },
  { id:'tolerance',   label:'Risk Tolerance',               color:'var(--due-priority)' },
  { id:'resilience',  label:'Enterprise Resilience',        color:'#26C6DA' },
  { id:'ai-gov',      label:'AI Governance',                color:'#78909C' },
  { id:'leadership',  label:'Leadership Reporting',         color:'#66BB6A' },
  { id:'july-srmc',   label:'July SRMC Offline Materials',  color:'#EF5350' },
  { id:'third-party', label:'Third Party Reliance',         color:'#AB47BC' },
  { id:'adhoc',       label:'Ad Hoc',                       color:'#9E9E9E' },
];

export const WS_LOA14 = [
  { id:'loa14-srm-materials',   label:'SRM Services Materials',                          color:'#86BC25' },
  { id:'loa14-kri-kpi',         label:'KRIs and KPIs',                                   color:'#00A3E0' },
  { id:'loa14-console',         label:'Risk and Initiative Console',                      color:'#7B68EE' },
  { id:'loa14-alignment',       label:'Support Program Alignment Framework',              color:'#FB8C00' },
  { id:'loa14-assumptions',     label:'Assumptions Testing',                              color:'var(--due-priority)' },
  { id:'loa14-playbook',        label:'Updated Playbook Chapters',                        color:'#26C6DA' },
  { id:'loa14-reporting',       label:'Updated 2026 Risk Reporting Template and Tear Sheets', color:'#78909C' },
  { id:'loa14-trends',          label:'2027 External Trends Report',                      color:'#66BB6A' },
  { id:'loa14-pov',             label:'Risk POV',                                         color:'#EF5350' },
  { id:'loa14-council',         label:'Monthly SRM Council Meeting Materials',            color:'#AB47BC' },
  { id:'loa14-ai-gov',         label:'AI Strategy & Governance',                         color:'#5C6BC0' },
  { id:'loa14-adhoc',         label:'Ad Hoc',                                            color:'#9E9E9E' },
];

export const TEAM = ['Alyssa','Asma','Stewart','Sam','Bridget','Lily','Alex','Dmitriy'];

export const REVIEWERS = ['Alyssa','Asma','Dmitriy','Stewart','You Chen'];

export const STATUS = {
  'not-started': { label:'Not Started', cls:'s-ns' },
  'in-progress':  { label:'In Progress', cls:'s-ip' },
  'in-review':    { label:'In Review',   cls:'s-ir' },
  'complete':     { label:'Complete',    cls:'s-co' },
  'blocked':      { label:'Blocked',     cls:'s-bl' },
};

// Gantt columns: each month has an array of week anchor dates
// LOA 12: March – Aug 14, 2026 (last column is week of 8/10)
export const GCOLS_LOA12 = [
  { m:'Mar',  weeks:[{ lbl:'3/2',  d:'2026-03-02' }] },
  { m:'Apr',  weeks:[{ lbl:'4/6',  d:'2026-04-06' }] },
  { m:'May',  weeks:[
    { lbl:'5/4',  d:'2026-05-04' },
    { lbl:'5/11', d:'2026-05-11' },
    { lbl:'5/18', d:'2026-05-18' },
    { lbl:'5/25', d:'2026-05-25' },
  ]},
  { m:'June', weeks:[
    { lbl:'6/1',  d:'2026-06-01' },
    { lbl:'6/8',  d:'2026-06-08' },
    { lbl:'6/15', d:'2026-06-15' },
    { lbl:'6/22', d:'2026-06-22' },
    { lbl:'6/29', d:'2026-06-29' },
  ]},
  { m:'July', weeks:[
    { lbl:'7/6',  d:'2026-07-06' },
    { lbl:'7/13', d:'2026-07-13' },
    { lbl:'7/20', d:'2026-07-20' },
    { lbl:'7/27', d:'2026-07-27' },
  ]},
  { m:'Aug',  weeks:[
    { lbl:'8/3',  d:'2026-08-03' },
    { lbl:'8/10', d:'2026-08-10' },
  ]},
];

// LOA 14: Aug 17, 2026 – Jan 2027
export const GCOLS_LOA14 = [
  { m:'Aug',  weeks:[
    { lbl:'8/17', d:'2026-08-17' },
    { lbl:'8/24', d:'2026-08-24' },
    { lbl:'8/31', d:'2026-08-31' },
  ]},
  { m:'Sep',  weeks:[
    { lbl:'9/7',  d:'2026-09-07' },
    { lbl:'9/14', d:'2026-09-14' },
    { lbl:'9/21', d:'2026-09-21' },
    { lbl:'9/28', d:'2026-09-28' },
  ]},
  { m:'Oct',  weeks:[
    { lbl:'10/5',  d:'2026-10-05' },
    { lbl:'10/12', d:'2026-10-12' },
    { lbl:'10/19', d:'2026-10-19' },
    { lbl:'10/26', d:'2026-10-26' },
  ]},
  { m:'Nov',  weeks:[
    { lbl:'11/2',  d:'2026-11-02' },
    { lbl:'11/9',  d:'2026-11-09' },
    { lbl:'11/16', d:'2026-11-16' },
    { lbl:'11/23', d:'2026-11-23' },
    { lbl:'11/30', d:'2026-11-30' },
  ]},
  { m:'Dec',  weeks:[
    { lbl:'12/7',  d:'2026-12-07' },
    { lbl:'12/14', d:'2026-12-14' },
    { lbl:'12/21', d:'2026-12-21' },
    { lbl:'12/28', d:'2026-12-28' },
  ]},
  { m:'Jan',  weeks:[
    { lbl:'1/4',  d:'2027-01-04' },
    { lbl:'1/11', d:'2027-01-11' },
    { lbl:'1/18', d:'2027-01-18' },
    { lbl:'1/25', d:'2027-01-25' },
  ]},
];

// Default export for backwards compatibility
export const GCOLS = GCOLS_LOA12;

export const DEFAULTS = [
  // ── Annual Risk Refresh ──────────────────────────────────────────────────
  { id:'e001', ws:'annual',      name:'Research external trends',                        notes:'2026 External Risk Trends Summary',                                                                   due:'2026-03-06', owner:'Alyssa',  status:'complete',    type:'milestone-finalize', priority:false },
  { id:'e002', ws:'annual',      name:'Spring risk reporting & Tear Sheets',             notes:'Spring Executive Risk Tear Sheets',                                                                   due:'2026-03-13', owner:'Stewart', status:'complete',    type:'milestone-finalize', priority:false },
  { id:'e003', ws:'annual',      name:'Risk Shifts Discussion with SRMC',                notes:'Pre-read distributed; working session w/ SRMC',                                                      due:'2026-05-04', owner:'Alyssa',  status:'complete',    type:'meeting',            priority:false },
  { id:'e004', ws:'annual',      name:'Risk Categorization Workshop with SRMC',          notes:'Categorization workshop pre-read + facilitation',                                                     due:'2026-05-18', owner:'Bridget', status:'complete',    type:'milestone-finalize', priority:false },
  { id:'e005', ws:'annual',      name:'Draft Annual Refresh Report outline',             notes:'Sections: risk shifts, categorization outcomes, recs',                                                due:'2026-06-12', owner:'Lily',    status:'complete',    type:'task',               priority:false },
  { id:'e006', ws:'annual',      name:'Team Brainstorm of Intro',                        notes:'With Asma, team to brainstorm structure/content',                                                     due:'2026-06-22', owner:'Lily',    status:'not-started', type:'meeting',            priority:false },
  { id:'e007', ws:'annual',      name:'Draft Intro section',                             notes:'Focus on the value, how risk and strategy work together (use language from playbook); updated risk/strategy graphic w version in LTP onboarding deck', due:'2026-06-24', owner:'Lily', status:'not-started', type:'task', priority:true },
  { id:'e008', ws:'annual',      name:'→ Alyssa Review',                                notes:'',                                                                                                    due:'2026-06-25', owner:'Alyssa',  status:'not-started', type:'task',               priority:false, parentId:'e007', isReview:true, type:'swp-session' },
  { id:'e009', ws:'annual',      name:'→ Asma Review',                                  notes:'',                                                                                                    due:'2026-06-26', owner:'Asma',    status:'not-started', type:'task',               priority:false, parentId:'e007', isReview:true, type:'swp-session' },
  { id:'e010', ws:'annual',      name:'→ Stewart/Sam Review',                           notes:'',                                                                                                    due:'2026-07-01', owner:'Stewart', status:'not-started', type:'task',               priority:false, parentId:'e007', isReview:true, type:'swp-session' },
  { id:'e011', ws:'annual',      name:'→ Dmitriy Review',                               notes:'',                                                                                                    due:'2026-07-01', owner:'Dmitriy', status:'not-started', type:'task',               priority:false, parentId:'e007', isReview:true, type:'swp-session' },
  { id:'e012', ws:'annual',      name:'Annual Refresh Report finalized, send to YC',    notes:'SWP-Wide 2026–2027 Refresh Report',                                                                   due:'2026-07-15', owner:'Lily',    status:'not-started', type:'milestone-finalize', priority:false },

  // ── Scenario Exercise ────────────────────────────────────────────────────
  { id:'e013', ws:'scenario',    name:'Meeting with LTP — workshop outcomes',            notes:'LTP Core Group Scenario Outputs',                                                                     due:'2026-03-02', owner:'Alyssa',  status:'complete',    type:'meeting',            priority:false },
  { id:'e014', ws:'scenario',    name:'Prepare scenario facilitation deck',              notes:'Send to YC/OV 48 hrs before session',                                                                 due:'2026-06-05', owner:'Bridget', status:'complete',    type:'task',               priority:false },
  { id:'e015', ws:'scenario',    name:'Conduct scenario exercise for SRMC',              notes:'Second Scenario Workshop with SRMC',                                                                  due:'2026-06-08', owner:'Bridget', status:'complete',    type:'meeting',            priority:false },
  { id:'e016', ws:'scenario',    name:'Finalize Outcome Slides',                         notes:'Share w DB, prep for SRMC to view',                                                                   due:'2026-06-22', owner:'Bridget', status:'complete',    type:'task',               priority:false },

  // ── SRM Playbook ─────────────────────────────────────────────────────────
  { id:'e017', ws:'playbook',    name:'Playbook milestone #1 — internal draft',          notes:'First complete draft for internal review',                                                            due:'2026-06-08', owner:'Lily',    status:'complete',    type:'milestone-key',      priority:false },
  { id:'e018', ws:'playbook',    name:'Address YC feedback for Overview/Governance',     notes:'',                                                                                                    due:'2026-06-10', owner:'Alyssa',  status:'complete',    type:'task',               priority:false },
  { id:'e019', ws:'playbook',    name:'Draft Annual Refresh Section',                    notes:'',                                                                                                    due:'2026-06-16', owner:'Lily',    status:'complete',    type:'task',               priority:false },
  { id:'e020', ws:'playbook',    name:'→ Alyssa Review (Annual Refresh)',                notes:'Review outline, Lily continue to update, then do another review',                                     due:'2026-06-17', owner:'Alyssa',  status:'not-started', type:'task',               priority:false, parentId:'e019', isReview:true, type:'swp-session' },
  { id:'e021', ws:'playbook',    name:'→ Stewart/Sam Review (Annual Refresh)',           notes:'Send EOD June 18',                                                                                    due:'2026-06-23', owner:'Stewart', status:'not-started', type:'task',               priority:false, parentId:'e019', isReview:true, type:'swp-session' },
  { id:'e022', ws:'playbook',    name:'→ Asma Review (Annual Refresh)',                  notes:'',                                                                                                    due:'2026-06-24', owner:'Asma',    status:'not-started', type:'task',               priority:false, parentId:'e019', isReview:true, type:'swp-session' },
  { id:'e023', ws:'playbook',    name:'Send Annual Refresh Section to YC',               notes:'Send June 25',                                                                                        due:'2026-06-24', owner:'Lily',    status:'not-started', type:'milestone-key',      priority:false },
  { id:'e024', ws:'playbook',    name:'Address YC feedback — Annual Refresh Section',    notes:'',                                                                                                    due:'',           owner:'Alyssa',  status:'not-started', type:'task',               priority:false },
  { id:'e025', ws:'playbook',    name:'Draft Tools section',                             notes:'',                                                                                                    due:'2026-06-23', owner:'Lily',    status:'not-started', type:'task',               priority:false },
  { id:'e026', ws:'playbook',    name:'→ Alyssa Review (Tools)',                         notes:'Review outline, Lily continue to update, then do another review',                                     due:'2026-06-24', owner:'Alyssa',  status:'not-started', type:'task',               priority:false, parentId:'e025', isReview:true, type:'swp-session' },
  { id:'e027', ws:'playbook',    name:'→ Asma Review (Tools)',                           notes:'',                                                                                                    due:'2026-06-26', owner:'Asma',    status:'not-started', type:'task',               priority:false, parentId:'e025', isReview:true, type:'swp-session' },
  { id:'e028', ws:'playbook',    name:'→ Stewart/Sam Review (Tools)',                    notes:'',                                                                                                    due:'2026-06-30', owner:'Stewart', status:'not-started', type:'task',               priority:false, parentId:'e025', isReview:true, type:'swp-session' },
  { id:'e029', ws:'playbook',    name:'Send Tools Section to YC',                        notes:'',                                                                                                    due:'2026-07-09', owner:'Lily',    status:'not-started', type:'milestone-key',      priority:false },
  { id:'e030', ws:'playbook',    name:'Address YC feedback — Tools Section',             notes:'',                                                                                                    due:'',           owner:'Alyssa',  status:'not-started', type:'task',               priority:false },
  { id:'e031', ws:'playbook',    name:'Draft Lifecycle section',                         notes:'',                                                                                                    due:'2026-07-01', owner:'Lily',    status:'not-started', type:'milestone-key',      priority:false },
  { id:'e032', ws:'playbook',    name:'→ Alyssa Review (Lifecycle)',                     notes:'Review outline, Lily continue to update, then do another review',                                     due:'2026-07-10', owner:'Alyssa',  status:'not-started', type:'task',               priority:false, parentId:'e031', isReview:true, type:'swp-session' },
  { id:'e033', ws:'playbook',    name:'→ Asma Review (Lifecycle)',                       notes:'',                                                                                                    due:'2026-07-16', owner:'Asma',    status:'not-started', type:'task',               priority:false, parentId:'e031', isReview:true, type:'swp-session' },
  { id:'e034', ws:'playbook',    name:'→ Stewart/Sam Review (Lifecycle)',                notes:'',                                                                                                    due:'2026-07-20', owner:'Stewart', status:'not-started', type:'task',               priority:false, parentId:'e031', isReview:true, type:'swp-session' },
  { id:'e035', ws:'playbook',    name:'Send Lifecycle Section to YC',                    notes:'',                                                                                                    due:'2026-07-23', owner:'Lily',    status:'not-started', type:'milestone-key',      priority:false },
  { id:'e036', ws:'playbook',    name:'Develop one-pagers for each tool',                notes:"Create a PPT slide overview of each tool as a 'leave behind' — used in roadshow",                   due:'2026-08-03', owner:'Lily',    status:'not-started', type:'milestone-finalize', priority:false },
  { id:'e037', ws:'playbook',    name:'Finalize Draft SRM Playbook',                     notes:'Deliverable: Draft SRM Playbook',                                                                     due:'2026-08-03', owner:'Lily',    status:'not-started', type:'milestone-finalize', priority:false },

  // ── KRI Development ──────────────────────────────────────────────────────
  { id:'e038', ws:'kri',         name:'KRI development — milestone A',                  notes:'Initial KRI drafts per top risk',                                                                     due:'2026-03-06', owner:'Alex',    status:'complete',    type:'milestone-key',      priority:false },
  { id:'e039', ws:'kri',         name:'KRI development — milestone B',                  notes:'Validate structure with risk leads',                                                                   due:'2026-04-06', owner:'Alex',    status:'complete',    type:'milestone-key',      priority:false },
  { id:'e040', ws:'kri',         name:'Finalize all KRIs',                              notes:'Review remaining KRIs and draft up metrics/possible data sources',                                    due:'2026-06-19', owner:'Bridget', status:'not-started', type:'task',               priority:true  },
  { id:'e041', ws:'kri',         name:'Finalize KRIs w Asma/DB',                        notes:'Review/finalize KRIs — send by Wednesday',                                                            due:'2026-06-26', owner:'Bridget', status:'not-started', type:'meeting',            priority:false },
  { id:'e042', ws:'kri',         name:'Share Data Repository/KRI/KPIs w YC',            notes:"Share Excel repository of all data and metrics (send before we're out for 4th)",                     due:'2026-07-01', owner:'Bridget', status:'not-started', type:'milestone-finalize', priority:false },
  { id:'e043', ws:'kri',         name:'Write up KRI Validation emails',                  notes:'Send out when YC is back to all risk leads to review/validate their KRIs',                           due:'2026-07-09', owner:'Bridget', status:'not-started', type:'task',               priority:false },
  { id:'e044', ws:'kri',         name:'YC send out Metric Validation emails',            notes:'Make sure YC sends out',                                                                              due:'2026-07-16', owner:'Bridget', status:'not-started', type:'task',               priority:false },

  // ── Risk Tolerance ───────────────────────────────────────────────────────
  { id:'e045', ws:'tolerance',   name:'Define Risk Tolerance working session',           notes:'Program Alignment Framework integration',                                                             due:'2026-05-18', owner:'Stewart', status:'complete',    type:'meeting',            priority:false },
  { id:'e046', ws:'tolerance',   name:'Develop Tolerance for each risk',                notes:'Develop risk tolerance statements for each risk',                                                     due:'2026-06-23', owner:'Bridget', status:'not-started', type:'task',               priority:false },
  { id:'e047', ws:'tolerance',   name:'→ Alyssa Review',                               notes:'',                                                                                                    due:'2026-06-23', owner:'Alyssa',  status:'not-started', type:'task',               priority:false, parentId:'e046', isReview:true, type:'swp-session' },
  { id:'e048', ws:'tolerance',   name:'→ Asma Review',                                 notes:'Review w Asma',                                                                                       due:'2026-06-24', owner:'Asma',    status:'not-started', type:'task',               priority:false, parentId:'e046', isReview:true, type:'swp-session' },
  { id:'e049', ws:'tolerance',   name:'→ DB Review',                                   notes:'Review during Mon mtg',                                                                               due:'2026-06-29', owner:'Dmitriy', status:'not-started', type:'task',               priority:false, parentId:'e046', isReview:true, type:'swp-session' },
  { id:'e050', ws:'tolerance',   name:'Finalize tolerance materials in SRMC deck',      notes:'',                                                                                                    due:'2026-07-23', owner:'Bridget', status:'not-started', type:'milestone-finalize', priority:false },

  // ── Enterprise Resilience ────────────────────────────────────────────────
  { id:'e051', ws:'resilience',  name:'Current state document review',                  notes:'Repository of SWP Resilience Docs',                                                                   due:'2026-03-06', owner:'Bridget', status:'complete',    type:'milestone-finalize', priority:false },
  { id:'e052', ws:'resilience',  name:'Identify gaps & develop doc list',               notes:'List of documents for potential development',                                                         due:'2026-07-13', owner:'Bridget', status:'not-started', type:'milestone-finalize', priority:true  },

  // ── AI Governance ────────────────────────────────────────────────────────
  { id:'e053', ws:'ai-gov',      name:'AI Governance [currently on hold]',               notes:'AI Policy Recommendations + AI Governance Structure — HOLD',                                         due:'2026-08-31', owner:'Asma',    status:'blocked',     type:'task',               priority:false },
  { id:'e054', ws:'ai-gov',      name:'DWR AI Survey Analysis',                          notes:'Next steps based on YC feedback',                                                                    due:'2026-06-18', owner:'Alyssa',  status:'not-started', type:'task',               priority:false },

  // ── Leadership Reporting ─────────────────────────────────────────────────
  { id:'e055', ws:'leadership',  name:'Categorization leadership materials',             notes:'Leadership presentation for Categorization Workshop',                                                 due:'2026-05-18', owner:'Alyssa',  status:'complete',    type:'milestone-finalize', priority:false },
  { id:'e056', ws:'leadership',  name:'Send scenario pre-read to SRMC',                  notes:'Distribute 48 hrs before scenario session',                                                          due:'2026-06-06', owner:'Alyssa',  status:'complete',    type:'task',               priority:false },
  { id:'e057', ws:'leadership',  name:'Scenario leadership materials',                   notes:'Leadership key takeaways post-scenario session',                                                     due:'2026-06-08', owner:'Alyssa',  status:'complete',    type:'milestone-finalize', priority:false },
  { id:'e058', ws:'leadership',  name:'Aug SRMC - Brainstorm agenda',                    notes:'Review SRMC workshop w Asma',                                                                        due:'2026-06-19', owner:'Lily',    status:'not-started', type:'meeting',            priority:false },
  { id:'e059', ws:'leadership',  name:'Aug SRMC - Draft workshop materials',             notes:'Create shell deck',                                                                                  due:'2026-06-21', owner:'Lily',    status:'not-started', type:'task',               priority:false },
  { id:'e060', ws:'leadership',  name:'→ Alyssa Review',                                notes:'',                                                                                                   due:'2026-06-23', owner:'Alyssa',  status:'not-started', type:'task',               priority:false, parentId:'e059', isReview:true, type:'swp-session' },
  { id:'e061', ws:'leadership',  name:'→ Asma Review',                                  notes:'Review w Asma',                                                                                      due:'2026-06-24', owner:'Asma',    status:'not-started', type:'task',               priority:false, parentId:'e059', isReview:true, type:'swp-session' },
  { id:'e062', ws:'leadership',  name:'→ DB Review',                                    notes:'Review during Mon mtg',                                                                              due:'2026-06-29', owner:'Dmitriy', status:'not-started', type:'task',               priority:false, parentId:'e059', isReview:true, type:'swp-session' },
  { id:'e063', ws:'leadership',  name:'Aug SRMC - final polish',                         notes:'Finalize Aug SRMC materials',                                                                        due:'2026-07-01', owner:'Lily',    status:'not-started', type:'task',               priority:false },
  { id:'e064', ws:'leadership',  name:'Share agenda w YC in weekly',                     notes:'Share initial agenda/workshop ideas',                                                                due:'2026-07-15', owner:'Bridget', status:'not-started', type:'task',               priority:false },
  { id:'e065', ws:'leadership',  name:'Share materials w YC',                            notes:'Share full deck ahead of dry run',                                                                   due:'2026-07-23', owner:'Bridget', status:'not-started', type:'task',               priority:false },
  { id:'e066', ws:'leadership',  name:'Aug SRMC - Share preread',                        notes:'',                                                                                                   due:'2026-08-04', owner:'Bridget', status:'not-started', type:'milestone-finalize', priority:false },
  { id:'e067', ws:'leadership',  name:'Facilitate Aug SRMC',                             notes:'',                                                                                                   due:'2026-08-11', owner:'Alyssa',  status:'not-started', type:'milestone-key',      priority:false },

  // ── July SRMC Offline Materials ──────────────────────────────────────────
  { id:'e068', ws:'july-srmc',   name:'Meeting to discuss July contents',                notes:'Discuss w Asma what we should include',                                                              due:'2026-06-22', owner:'Alyssa',  status:'not-started', type:'meeting',            priority:false },
  { id:'e069', ws:'july-srmc',   name:'Develop package to send SRMC in lieu of July mtg', notes:'Include scenario slides (already drafted). From YC: ideal ending of the contract, how was scenario, program alignment. Ask Avery about program alignment; Jorge about energy market POV; Marcus about Knowledge Management risk response; Ravi about overall process and strategy/initiative combo.', due:'2026-06-25', owner:'Bridget', status:'not-started', type:'task', priority:false },

  // ── Third Party Reliance ─────────────────────────────────────────────────
  { id:'e070', ws:'third-party', name:'Update risk reporting template',                  notes:'See if YC is good with updates',                                                                     due:'2026-06-24', owner:'Lily',    status:'not-started', type:'task',               priority:false },

  // ── Ad Hoc ───────────────────────────────────────────────────────────────
  { id:'e071', ws:'adhoc',       name:'June Significant Events Calendar',                notes:'Review',                                                                                             due:'2026-06-18', owner:'Alyssa',  status:'not-started', type:'task',               priority:false },
];
