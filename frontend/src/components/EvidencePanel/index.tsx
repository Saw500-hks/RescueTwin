/**
 * EvidencePanel Component
 *
 * Displays the evidence chain for a building assessment with proper
 * data integrity labeling. Every assessment conclusion must be
 * traceable to a specific evidence item.
 *
 * Data integrity rules:
 * - NEVER fabricate evidence items, confidence scores, or imagery
 * - If evidence is missing: show "Not Available" explicitly
 * - Distinguish: VERIFIED DATA / MODEL OUTPUT / DEMO DATA / UNAVAILABLE
 */
import React from 'react';
import {
  Satellite, Box, Camera, FileText, Database,
  CheckCircle2, AlertCircle, HelpCircle, Clock,
  Info, AlertTriangle
} from 'lucide-react';
import clsx from 'clsx';

export interface EvidenceItem {
  type: 'satellite_imagery' | 'change_detection' | 'damage_model' | 'field_survey' | 'gis_layer' | '3d_reconstruction';
  label: string;
  status: 'available' | 'unavailable' | 'processing';
  data_status: 'VERIFIED DATA' | 'MODEL OUTPUT' | 'DEMO DATA' | 'UNAVAILABLE' | 'SIMULATION';
  source?: string;
  capture_date?: string;
  value?: string | number | null;
  value_label?: string;
  confidence?: number | null;
  note?: string;
}

interface EvidencePanelProps {
  buildingId: string;
  buildingName?: string;
  items?: EvidenceItem[];
  assessmentConclusion?: string;
  conclusionDataStatus?: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  satellite_imagery: <Satellite className="w-3.5 h-3.5" />,
  change_detection: <Camera className="w-3.5 h-3.5" />,
  damage_model: <Database className="w-3.5 h-3.5" />,
  field_survey: <FileText className="w-3.5 h-3.5" />,
  gis_layer: <Box className="w-3.5 h-3.5" />,
  '3d_reconstruction': <Box className="w-3.5 h-3.5" />,
};

const statusConfig = {
  available: { icon: <CheckCircle2 className="w-3 h-3" />, color: '#22C55E', label: 'Available' },
  unavailable: { icon: <HelpCircle className="w-3 h-3" />, color: '#64748B', label: 'Unavailable' },
  processing: { icon: <Clock className="w-3 h-3" />, color: '#F59E0B', label: 'Processing' },
};

const dataStatusColors: Record<string, string> = {
  'VERIFIED DATA': 'text-green-400 bg-green-500/10 border-green-500/25',
  'MODEL OUTPUT': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25',
  'DEMO DATA': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25',
  'UNAVAILABLE': 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  'SIMULATION': 'text-purple-400 bg-purple-500/10 border-purple-500/25',
};

// Default evidence items for a building with no processed data
const DEFAULT_UNAVAILABLE_ITEMS: EvidenceItem[] = [
  {
    type: 'satellite_imagery',
    label: 'Pre-Event Satellite Imagery',
    status: 'unavailable',
    data_status: 'UNAVAILABLE',
    note: 'No pre-event satellite imagery has been registered for this building.',
  },
  {
    type: 'satellite_imagery',
    label: 'Post-Event Satellite Imagery',
    status: 'unavailable',
    data_status: 'UNAVAILABLE',
    note: 'Post-event imagery must be captured within 72h of the disaster event.',
  },
  {
    type: 'change_detection',
    label: 'Pre/Post Change Detection',
    status: 'unavailable',
    data_status: 'UNAVAILABLE',
    note: 'Requires both pre and post imagery to run the ORB/RANSAC change detection pipeline.',
  },
  {
    type: 'damage_model',
    label: 'Damage Classification (ML Model)',
    status: 'unavailable',
    data_status: 'UNAVAILABLE',
    note: 'Requires change detection output. Siamese ResNet-18 damage classifier not yet run for this building.',
  },
  {
    type: 'field_survey',
    label: 'Field Survey Report',
    status: 'unavailable',
    data_status: 'UNAVAILABLE',
    note: 'No field survey data submitted for this building.',
  },
  {
    type: '3d_reconstruction',
    label: '3D Point Cloud Reconstruction',
    status: 'unavailable',
    data_status: 'UNAVAILABLE',
    note: 'Requires multi-view imagery for 3D reconstruction.',
  },
];

const EvidencePanel: React.FC<EvidencePanelProps> = ({
  buildingId,
  buildingName,
  items,
  assessmentConclusion,
  conclusionDataStatus = 'UNAVAILABLE',
}) => {
  const evidenceItems = items?.length ? items : DEFAULT_UNAVAILABLE_ITEMS;
  const availableCount = evidenceItems.filter((e) => e.status === 'available').length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 mb-0.5">
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Evidence Chain</span>
        </div>
        {buildingId && (
          <div className="text-[10px] text-slate-500 font-mono">{buildingName || buildingId}</div>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <div className="h-1.5 flex-1 rounded-full bg-black/40 overflow-hidden">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
              style={{ width: `${evidenceItems.length > 0 ? (availableCount / evidenceItems.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
            {availableCount}/{evidenceItems.length} evidence items
          </span>
        </div>
      </div>

      {/* Evidence Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {evidenceItems.map((item, i) => {
          const sc = statusConfig[item.status];
          return (
            <div
              key={i}
              className={clsx(
                'rounded-lg p-2.5 border transition-all',
                item.status === 'available'
                  ? 'bg-black/30 border-white/[0.08]'
                  : 'bg-black/15 border-white/[0.04] opacity-70'
              )}
            >
              {/* Row 1: Icon + Label + Status */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span style={{ color: item.status === 'available' ? '#38BDF8' : '#475569' }}>
                    {typeIcons[item.type] || <Database className="w-3.5 h-3.5" />}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-200">{item.label}</span>
                </div>
                <div className="flex items-center gap-1" style={{ color: sc.color }}>
                  {sc.icon}
                  <span className="text-[9px] font-bold">{sc.label}</span>
                </div>
              </div>

              {/* Row 2: Data Status */}
              <span className={clsx(
                'inline-flex items-center text-[8.5px] font-bold px-1.5 py-0.5 rounded border',
                dataStatusColors[item.data_status] || dataStatusColors['UNAVAILABLE']
              )}>
                {item.data_status}
              </span>

              {/* Row 3: Value / Confidence */}
              {item.status === 'available' && (item.value != null || item.confidence != null) && (
                <div className="mt-1.5 flex items-center gap-3">
                  {item.value != null && (
                    <div>
                      <div className="text-[8.5px] text-slate-500 uppercase tracking-wider">{item.value_label || 'Value'}</div>
                      <div className="text-[12px] font-bold text-slate-100">{String(item.value)}</div>
                    </div>
                  )}
                  {item.confidence != null && (
                    <div>
                      <div className="text-[8.5px] text-slate-500 uppercase tracking-wider">Confidence</div>
                      <div className="text-[12px] font-bold text-cyan-400">{(item.confidence * 100).toFixed(1)}%</div>
                    </div>
                  )}
                </div>
              )}

              {/* Source / Date */}
              {item.source && (
                <div className="mt-1 text-[9px] text-slate-500">Source: {item.source}</div>
              )}
              {item.capture_date && (
                <div className="text-[9px] text-slate-500">Captured: {item.capture_date}</div>
              )}

              {/* Note */}
              {item.note && (
                <div className="mt-1.5 flex items-start gap-1 text-[9px] text-slate-500 italic">
                  <Info className="w-2.5 h-2.5 flex-shrink-0 mt-0.5" />
                  <span>{item.note}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Assessment Conclusion */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          ASSESSMENT CONCLUSION
        </div>
        {assessmentConclusion ? (
          <div className="rounded-lg p-2.5 bg-cyan-500/5 border border-cyan-500/15">
            <p className="text-[10px] text-slate-300 leading-relaxed">{assessmentConclusion}</p>
            <span className={clsx(
              'inline-flex items-center text-[8.5px] font-bold px-1.5 py-0.5 rounded border mt-1.5',
              dataStatusColors[conclusionDataStatus] || dataStatusColors['UNAVAILABLE']
            )}>
              {conclusionDataStatus}
            </span>
          </div>
        ) : (
          <div className="rounded-lg p-2.5 bg-slate-500/5 border border-slate-500/15">
            <div className="flex items-start gap-1.5">
              <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-400 leading-relaxed">
                No assessment conclusion available. Evidence collection required before a
                damage classification can be made. Do not assume structural damage from
                flood exposure alone.
              </p>
            </div>
            <span className={clsx(
              'inline-flex items-center text-[8.5px] font-bold px-1.5 py-0.5 rounded border mt-1.5',
              dataStatusColors['UNAVAILABLE']
            )}>
              UNAVAILABLE
            </span>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-2 px-2 py-1.5 rounded bg-red-500/5 border border-red-500/15">
          <p className="text-[9px] text-red-400/70 leading-relaxed">
            ⚠ Evidence-based only. This system will not fabricate assessments.
            Field verification required for all structural damage conclusions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EvidencePanel;
