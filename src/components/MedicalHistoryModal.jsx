import {
  X,
  Printer,
  FileText,
  PawPrint,
  UserRound,
  Building2,
  CalendarDays,
  Clock,
  Stethoscope,
  Pill,
  ClipboardList,
  NotebookPen,
  FlaskConical,
  Video,
  MapPin,
} from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────────────────

const formatDate = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d) ? v : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const formatTime = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d) ? v : d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

const getClientName = (c) => {
  if (!c) return null;
  const full = `${c.firstName || ""} ${c.lastName || ""}`.trim();
  return full || c.userName || c.email || null;
};

const formatPetGender = (g) => (g === 0 ? "Male" : g === 1 ? "Female" : "—");

const normalizeHistoryRecords = (h) => {
  if (!h) return [];
  if (Array.isArray(h)) return h;
  if (Array.isArray(h?.data)) return h.data;
  if (Array.isArray(h?.medicalHistory)) return h.medicalHistory;
  if (Array.isArray(h?.data?.medicalHistory)) return h.data.medicalHistory;
  if (h?.id || h?.appointmentId || h?.mainReasonForVisit) return [h];
  if (h?.data?.id || h?.data?.appointmentId || h?.data?.mainReasonForVisit) return [h.data];
  return [];
};

const getRecordAppointment = (record, fallbackAppointment = null) =>
  record?.appointment ||
  record?.appointmentDetails ||
  record?.appointmentDto ||
  record?.booking ||
  fallbackAppointment ||
  null;

const getRecordAppointmentId = (record, fallbackAppointment = null) => {
  const appt = getRecordAppointment(record, fallbackAppointment);
  return appt?.id || appt?.appointmentId || record?.appointmentId || "—";
};

const getRecordAppointmentStartTime = (record, fallbackAppointment = null) => {
  const appt = getRecordAppointment(record, fallbackAppointment);
  return (
    appt?.startTime ||
    appt?.appointmentStartTime ||
    record?.appointmentStartTime ||
    record?.startTime ||
    record?.appointmentDate ||
    null
  );
};

const getRecordAppointmentEndTime = (record, fallbackAppointment = null) => {
  const appt = getRecordAppointment(record, fallbackAppointment);
  return appt?.endTime || appt?.appointmentEndTime || record?.appointmentEndTime || record?.endTime || null;
};

const getRecordAppointmentType = (record, fallbackAppointment = null) => {
  const appt = getRecordAppointment(record, fallbackAppointment);
  const type = appt?.type ?? appt?.appointmentType ?? record?.appointmentType ?? record?.type ?? null;
  if (type === 1 || type === "1" || String(type).toLowerCase().includes("online")) return "Online / Video";
  if (type === 0 || type === "0" || String(type).toLowerCase().includes("physical")) return "In-Person";
  return "—";
};

// ─── small atoms ────────────────────────────────────────────────────────────

const SectionLabel = ({ children }) => (
  <p className="text-[10px] font-bold uppercase tracking-widest text-base-content/40 mb-1">
    {children}
  </p>
);

const Field = ({ label, value, icon: Icon, wide }) => (
  <div className={wide ? "col-span-2" : ""}>
    <div className="flex items-center gap-1 mb-0.5">
      {Icon && <Icon size={11} className="text-base-content/30" />}
      <SectionLabel>{label}</SectionLabel>
    </div>
    <p className="text-sm text-base-content leading-relaxed whitespace-pre-wrap break-words">
      {value || <span className="text-base-content/30 italic text-xs">Not recorded</span>}
    </p>
  </div>
);

const StatusPill = ({ status }) => {
  if (!status) return null;
  const s = status.toLowerCase();
  const cls = s.includes("resolv") || s.includes("recov")
    ? "badge-success"
    : s.includes("ongo") || s.includes("activ")
    ? "badge-warning"
    : s.includes("crit")
    ? "badge-error"
    : "badge-ghost";
  return <span className={`badge badge-sm ${cls}`}>{status}</span>;
};

// ─── info panel ─────────────────────────────────────────────────────────────

const Panel = ({ icon: Icon, title, children }) => (
  <div className="rounded-xl border border-base-300 overflow-hidden bg-base-100">
    <div className="flex items-center gap-2 px-3.5 py-2.5 bg-base-200/60 border-b border-base-300">
      <Icon size={13} className="text-base-content/50" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-base-content/50">{title}</span>
    </div>
    <div className="px-3.5 py-3 space-y-1.5 text-[12px]">{children}</div>
  </div>
);

const Row = ({ label, value }) =>
  value ? (
    <div className="flex justify-between gap-2">
      <span className="text-base-content/40 shrink-0">{label}</span>
      <span className="text-base-content/80 font-medium text-right">{value}</span>
    </div>
  ) : null;

// ─── appointment strip inside each record card (for pet history) ─────────────

const RecordAppointmentStrip = ({ record, fallbackAppointment }) => {
  const appointmentId = getRecordAppointmentId(record, fallbackAppointment);
  const startTime = getRecordAppointmentStartTime(record, fallbackAppointment);
  const endTime = getRecordAppointmentEndTime(record, fallbackAppointment);
  const appointmentType = getRecordAppointmentType(record, fallbackAppointment);
  const hasAppointmentInfo = appointmentId !== "—" || startTime || endTime || appointmentType !== "—";
  if (!hasAppointmentInfo) return null;

  return (
    <div className="mx-4 mt-4 rounded-xl border border-base-300 bg-base-200/40 px-3.5 py-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-base-content/40 flex items-center gap-1.5 mb-2.5">
        <CalendarDays size={11} />
        Related Appointment
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[12px]">
        <div>
          <p className="text-base-content/40 text-[10px]">Date</p>
          <p className="text-base-content font-medium">{formatDate(startTime)}</p>
        </div>
        <div>
          <p className="text-base-content/40 text-[10px]">Time</p>
          <p className="text-base-content font-medium">{formatTime(startTime)}</p>
        </div>
        <div>
          <p className="text-base-content/40 text-[10px]">Type</p>
          <p className="text-base-content font-medium flex items-center gap-1">
            {appointmentType === "Online / Video" ? <Video size={11} /> : <MapPin size={11} />}
            {appointmentType}
          </p>
        </div>
        <div>
          <p className="text-base-content/40 text-[10px]">Appointment ID</p>
          <p className="text-base-content font-medium truncate">{appointmentId}</p>
        </div>
      </div>
    </div>
  );
};

// ─── single record card ──────────────────────────────────────────────────────

/**
 * showAppointmentStrip:
 *   - Appointment history (single record, top-level appt bar already shown) → false
 *   - Pet history (multiple records, each needs its own context)             → true
 */
const RecordCard = ({ record, index, fallbackAppointment, showAppointmentStrip }) => (
  <div className="rounded-xl border border-base-300 bg-base-100 overflow-hidden">
    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-base-200/50 border-b border-base-300">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">
          {index + 1}
        </div>
        <div>
          <p className="text-sm font-semibold text-base-content leading-tight">
            {record.mainReasonForVisit || `Visit record ${index + 1}`}
          </p>
          {record.createdAt && (
            <p className="text-[11px] text-base-content/40 flex items-center gap-1 mt-0.5">
              <Clock size={9} /> {formatDate(record.createdAt)}
            </p>
          )}
        </div>
      </div>
      <StatusPill status={record.diagnosisStatus} />
    </div>

    {/* Only show per-record appointment strip in pet history mode */}
    {showAppointmentStrip && (
      <RecordAppointmentStrip record={record} fallbackAppointment={fallbackAppointment} />
    )}

    <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-4">
      <Field label="Diagnosis" icon={Stethoscope} value={record.diagnosis} />
      <Field label="Treatment" icon={FlaskConical} value={record.treatment} />
      <Field label="Medicines given" icon={Pill} value={record.medicinesGiven} />
      <Field label="Follow-up instructions" icon={ClipboardList} value={record.followUpInstructions} />
      {record.notes && (
        <div className="col-span-2 pt-3 mt-1 border-t border-base-200">
          <Field label="Additional notes" icon={NotebookPen} value={record.notes} />
        </div>
      )}
    </div>
  </div>
);

// ─── main modal ──────────────────────────────────────────────────────────────

const MedicalHistoryModal = ({
  isOpen,
  title = "Medical History",
  history,
  appointment,
  clinic,
  client,
  pet,
  isLoading,
  onClose,
}) => {
  if (!isOpen) return null;

  const records = normalizeHistoryRecords(history);
  const clientName = getClientName(client) || "—";
  const petName = pet?.name || "—";

  /**
   * isPetHistory: true  → "Full Pet Medical History" (multiple records, each with own appt strip)
   *              false → "Appointment Medical History" (one or more records, top-level appt bar shown)
   */
  const isPetHistory = title.toLowerCase().includes("pet");

  // For appointment history with exactly one record, pass the top-level appointment as fallback
  // so RecordAppointmentStrip can still resolve data even if the record itself lacks it.
  // For pet history, each record carries its own appointment data → no fallback needed.
  const recordFallbackAppointment = !isPetHistory && records.length === 1 ? appointment : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />

      {/* ── print styles ── */}
      <style>{`
        @media print {
          body > * { visibility: hidden !important; }
          #mhm-print-root { visibility: visible !important; }
          #mhm-print-root {
            position: fixed !important;
            inset: 0 !important;
            overflow: visible !important;
            background: #fff !important;
            color: #111 !important;
          }
          #mhm-scroll-pane {
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
          }
          .mhm-no-print { display: none !important; }

          #mhm-doc {
            padding: 32px 40px !important;
            font-family: Georgia, 'Times New Roman', serif !important;
            color: #111 !important;
            background: #fff !important;
          }

          /* letterhead */
          #mhm-letterhead {
            display: flex !important;
            align-items: flex-start !important;
            justify-content: space-between !important;
            border-bottom: 2px solid #111 !important;
            padding-bottom: 14px !important;
            margin-bottom: 20px !important;
          }
          #mhm-letterhead .clinic-name { font-size: 20px !important; font-weight: 700 !important; letter-spacing: -0.3px !important; }
          #mhm-letterhead .clinic-meta { font-size: 11px !important; color: #555 !important; margin-top: 3px !important; line-height: 1.5 !important; }
          #mhm-letterhead .report-badge { text-align: right !important; }
          #mhm-letterhead .report-badge .report-title { font-size: 13px !important; font-weight: 700 !important; text-transform: uppercase !important; letter-spacing: 0.08em !important; }
          #mhm-letterhead .report-badge .report-meta { font-size: 10px !important; color: #777 !important; margin-top: 3px !important; }

          /* info strip */
          #mhm-info-strip {
            display: grid !important;
            gap: 12px !important;
            margin-bottom: 20px !important;
          }
          #mhm-info-strip.cols-2 { grid-template-columns: 1fr 1fr !important; }
          #mhm-info-strip.cols-3 { grid-template-columns: 1fr 1fr 1fr !important; }
          .mhm-info-box { border: 1px solid #ddd !important; border-radius: 6px !important; overflow: hidden !important; }
          .mhm-info-box-head { background: #f4f4f4 !important; border-bottom: 1px solid #ddd !important; padding: 5px 10px !important; font-size: 9px !important; font-weight: 700 !important; text-transform: uppercase !important; letter-spacing: 0.07em !important; color: #555 !important; }
          .mhm-info-box-body { padding: 8px 10px !important; font-size: 11px !important; color: #222 !important; line-height: 1.6 !important; }
          .mhm-info-box-body strong { font-weight: 600 !important; }

          /* appointment bar (appointment history only) */
          #mhm-appt-bar {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 8px !important;
            border: 1px solid #ddd !important;
            border-radius: 6px !important;
            padding: 10px 14px !important;
            margin-bottom: 20px !important;
            background: #fafafa !important;
            font-size: 11px !important;
          }
          .mhm-appt-item strong { display: block !important; font-size: 9px !important; text-transform: uppercase !important; letter-spacing: 0.06em !important; color: #888 !important; margin-bottom: 2px !important; }

          /* records */
          #mhm-records-heading {
            font-size: 11px !important;
            font-weight: 700 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.08em !important;
            color: #555 !important;
            border-bottom: 1px solid #ddd !important;
            padding-bottom: 6px !important;
            margin-bottom: 12px !important;
          }
          .mhm-record { border: 1px solid #ddd !important; border-radius: 6px !important; overflow: hidden !important; margin-bottom: 14px !important; page-break-inside: avoid !important; }
          .mhm-record-head { display: flex !important; align-items: center !important; justify-content: space-between !important; padding: 8px 12px !important; background: #f4f4f4 !important; border-bottom: 1px solid #ddd !important; }
          .mhm-record-head .rh-num { width: 22px !important; height: 22px !important; border-radius: 4px !important; background: #e0e0e0 !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; font-size: 11px !important; font-weight: 700 !important; margin-right: 8px !important; }
          .mhm-record-head .rh-title { font-size: 12px !important; font-weight: 600 !important; }
          .mhm-record-head .rh-date { font-size: 10px !important; color: #888 !important; }
          .mhm-record-head .rh-badge { font-size: 9px !important; font-weight: 700 !important; padding: 2px 8px !important; border-radius: 99px !important; border: 1px solid #bbb !important; background: #f0f0f0 !important; color: #444 !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; }

          /* per-record appointment sub-bar (pet history only) */
          .mhm-record-appt-bar {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 8px !important;
            padding: 8px 12px !important;
            border-bottom: 1px solid #eee !important;
            background: #fafafa !important;
            font-size: 10px !important;
          }
          .mhm-record-appt-bar strong { display: block !important; font-size: 9px !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; color: #999 !important; margin-bottom: 2px !important; }

          .mhm-record-body { padding: 10px 12px !important; display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 8px 24px !important; font-size: 11px !important; }
          .mhm-field-label { font-size: 9px !important; font-weight: 700 !important; text-transform: uppercase !important; letter-spacing: 0.07em !important; color: #888 !important; margin-bottom: 2px !important; }
          .mhm-field-value { color: #222 !important; line-height: 1.5 !important; }
          .mhm-field-wide { grid-column: span 2 !important; border-top: 1px solid #eee !important; padding-top: 8px !important; margin-top: 2px !important; }

          #mhm-print-footer { margin-top: 28px !important; padding-top: 10px !important; border-top: 1px solid #ddd !important; display: flex !important; justify-content: space-between !important; font-size: 9px !important; color: #aaa !important; }
        }

        @media screen {
          #mhm-print-only { display: none !important; }
        }
      `}</style>

      {/* modal card */}
      <div
        id="mhm-print-root"
        className="relative bg-base-100 border border-base-300 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col"
      >
        {/* header bar */}
        <div className="mhm-no-print flex items-center justify-between gap-4 px-6 py-4 border-b border-base-300 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText size={17} className="text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-base-content">{title}</h2>
              <p className="text-[11px] text-base-content/40 mt-0.5">
                View medical history records
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-circle"
              onClick={onClose}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* scrollable pane */}
        <div id="mhm-scroll-pane" className="overflow-y-auto flex-1 px-6 py-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <span className="loading loading-spinner loading-lg text-primary" />
              <p className="text-xs text-base-content/40">Loading records…</p>
            </div>
          ) : (
            <>
              {/* ══ SCREEN document ══ */}
              <div id="mhm-doc" className="space-y-5">

                {/* report title row */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-base-300">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 flex items-center gap-1.5 mb-1">
                      <PawPrint size={11} /> Petzy Clinic
                    </p>
                    <h1 className="text-xl font-bold text-base-content tracking-tight">{title}</h1>
                    <p className="text-xs text-base-content/40 mt-1.5 flex items-center gap-3">
                      <span className="flex items-center gap-1"><CalendarDays size={11} /> {formatDate(new Date())}</span>
                      <span className="flex items-center gap-1"><Clock size={11} /> {formatTime(new Date())}</span>
                    </p>
                  </div>
                  {records.length > 0 && (
                    <div className="bg-primary/10 text-primary rounded-xl px-4 py-3 text-right shrink-0">
                      <p className="text-2xl font-bold leading-none">{records.length}</p>
                      <p className="text-[10px] font-semibold mt-1 opacity-60">record{records.length !== 1 ? "s" : ""}</p>
                    </div>
                  )}
                </div>

                {/* 3-col info strip — always show clinic + client + pet */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Panel icon={Building2} title="Clinic">
                    <Row label="Name" value={clinic?.name} />
                    <Row label="Address" value={clinic?.address} />
                    <Row label="Phone" value={clinic?.phoneNumber} />
                  </Panel>
                  <Panel icon={UserRound} title="Client">
                    <Row label="Name" value={clientName} />
                    <Row label="Email" value={client?.email} />
                    <Row label="Phone" value={client?.phoneNumber} />
                  </Panel>
                  <Panel icon={PawPrint} title="Pet">
                    <Row label="Name" value={petName} />
                    <Row label="Species" value={pet?.species} />
                    <Row label="Breed" value={pet?.breed} />
                    <Row label="Gender" value={formatPetGender(pet?.gender)} />
                    <Row label="Date of birth" value={formatDate(pet?.dateOfBirth)} />
                    <Row label="Weight" value={pet?.weight ? `${pet.weight} kg` : null} />
                  </Panel>
                </div>

                {/*
                  Appointment bar:
                  - Appointment history → show the single top-level appointment details here.
                    Each RecordCard will NOT show its own strip (redundant).
                  - Pet history → omit this bar entirely.
                    Each RecordCard shows its own per-record strip instead.
                */}
                {!isPetHistory && appointment && (
                  <div className="rounded-xl border border-base-300 bg-base-200/40 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-base-content/40 flex items-center gap-1.5 mb-2.5">
                      <CalendarDays size={11} /> Appointment Details
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[12px]">
                      {[
                        ["Date", formatDate(appointment.startTime)],
                        ["Time", formatTime(appointment.startTime)],
                        ["Type", appointment.type === 1 ? "Online / Video" : "In-Person"],
                        ["ID", appointment.id || appointment.appointmentId || "—"],
                      ].map(([l, v]) => (
                        <div key={l}>
                          <p className="text-base-content/40 text-[10px]">{l}</p>
                          <p className="text-base-content font-medium">{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* records */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Stethoscope size={13} className="text-base-content/40" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-base-content/40">
                      Medical History
                    </p>
                    <div className="flex-1 h-px bg-base-300" />
                  </div>

                  {records.length > 0 ? (
                    records.map((rec, i) => (
                      <RecordCard
                        key={rec.id || rec.appointmentId || i}
                        record={rec}
                        index={i}
                        fallbackAppointment={recordFallbackAppointment}
                        // Pet history: each card shows its own appointment strip
                        // Appointment history: top-level bar already handles it
                        showAppointmentStrip={isPetHistory}
                      />
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-base-300 py-12 flex flex-col items-center gap-2">
                      <FileText size={26} className="text-base-content/20" />
                      <p className="text-sm text-base-content/40">No records found</p>
                    </div>
                  )}
                </div>

                {/* screen footer */}
                <div className="flex items-center justify-between pt-3 border-t border-base-300">
                  <p className="text-[10px] text-base-content/30">Generated by Petzy Clinic Dashboard</p>
                  <p className="text-[10px] text-base-content/30">{formatDate(new Date())} · {formatTime(new Date())}</p>
                </div>
              </div>

              {/* ══ PRINT-ONLY document ══ */}
              <div id="mhm-print-only">
                {/* letterhead */}
                <div id="mhm-letterhead">
                  <div>
                    <div className="clinic-name">{clinic?.name || "Petzy Clinic"}</div>
                    <div className="clinic-meta">
                      {clinic?.address && <span>{clinic.address}</span>}
                      {clinic?.phoneNumber && <span> &nbsp;·&nbsp; {clinic.phoneNumber}</span>}
                    </div>
                  </div>
                  <div className="report-badge">
                    <div className="report-title">{title}</div>
                    <div className="report-meta">
                      {formatDate(new Date())} &nbsp;·&nbsp; {formatTime(new Date())}
                    </div>
                  </div>
                </div>

                {/*
                  Info strip:
                  - Appointment history: 3 cols (client | pet | appointment)
                  - Pet history:         2 cols (client | pet)  — appointment per-record below
                */}
                <div id="mhm-info-strip" className={!isPetHistory && appointment ? "cols-3" : "cols-2"}>
                  {/* client */}
                  <div className="mhm-info-box">
                    <div className="mhm-info-box-head">Client</div>
                    <div className="mhm-info-box-body">
                      {[["Name", clientName], ["Email", client?.email], ["Phone", client?.phoneNumber]]
                        .filter(([, v]) => v)
                        .map(([l, v]) => <div key={l}><strong>{l}:</strong> {v}</div>)}
                    </div>
                  </div>

                  {/* pet */}
                  <div className="mhm-info-box">
                    <div className="mhm-info-box-head">Pet</div>
                    <div className="mhm-info-box-body">
                      {[
                        ["Name", petName],
                        ["Species", pet?.species],
                        ["Breed", pet?.breed],
                        ["Gender", formatPetGender(pet?.gender)],
                        ["Date of birth", formatDate(pet?.dateOfBirth)],
                        ["Weight", pet?.weight ? `${pet.weight} kg` : null],
                      ]
                        .filter(([, v]) => v)
                        .map(([l, v]) => <div key={l}><strong>{l}:</strong> {v}</div>)}
                    </div>
                  </div>

                  {/* appointment box — only for appointment history */}
                  {!isPetHistory && appointment && (
                    <div className="mhm-info-box">
                      <div className="mhm-info-box-head">Appointment</div>
                      <div className="mhm-info-box-body">
                        {[
                          ["Date", formatDate(appointment.startTime)],
                          ["Time", formatTime(appointment.startTime)],
                          ["Type", appointment.type === 1 ? "Online / Video" : "In-Person"],
                          ["ID", appointment.id || appointment.appointmentId],
                        ]
                          .filter(([, v]) => v)
                          .map(([l, v]) => <div key={l}><strong>{l}:</strong> {v}</div>)}
                      </div>
                    </div>
                  )}
                </div>

                <div id="mhm-records-heading">Medical History Records</div>

                {records.length > 0 ? (
                  records.map((rec, i) => {
                    // For pet history, resolve per-record appointment info
                    const recApptId     = isPetHistory ? getRecordAppointmentId(rec)          : (appointment?.id || appointment?.appointmentId || "—");
                    const recStartTime  = isPetHistory ? getRecordAppointmentStartTime(rec)   : appointment?.startTime;
                    const recApptType   = isPetHistory ? getRecordAppointmentType(rec)        : (appointment?.type === 1 ? "Online / Video" : "In-Person");

                    return (
                      <div key={rec.id || i} className="mhm-record">
                        {/* record header */}
                        <div className="mhm-record-head">
                          <div>
                            <span className="rh-num">{i + 1}</span>
                            <span className="rh-title">
                              {rec.mainReasonForVisit || `Visit record ${i + 1}`}
                            </span>
                            {rec.createdAt && (
                              <span className="rh-date"> &nbsp;·&nbsp; {formatDate(rec.createdAt)}</span>
                            )}
                          </div>
                          {rec.diagnosisStatus && (
                            <span className="rh-badge">{rec.diagnosisStatus}</span>
                          )}
                        </div>

                        {/*
                          Per-record appointment sub-bar:
                          - Pet history   → always shown (each record has different appointment)
                          - Appt history  → shown only if appointment data exists
                            (top info box already covers it but repeating here is helpful in print)
                        */}
                        {(isPetHistory || appointment) && (
                          <div className="mhm-record-appt-bar">
                            <div><strong>Date</strong>{formatDate(recStartTime)}</div>
                            <div><strong>Time</strong>{formatTime(recStartTime)}</div>
                            <div><strong>Type</strong>{recApptType}</div>
                            <div><strong>Appointment ID</strong>{recApptId}</div>
                          </div>
                        )}

                        {/* record fields */}
                        <div className="mhm-record-body">
                          {[
                            ["Diagnosis", rec.diagnosis],
                            ["Treatment", rec.treatment],
                            ["Medicines given", rec.medicinesGiven],
                            ["Follow-up instructions", rec.followUpInstructions],
                          ].map(([l, v]) => (
                            <div key={l}>
                              <div className="mhm-field-label">{l}</div>
                              <div className="mhm-field-value">{v || "—"}</div>
                            </div>
                          ))}
                          {rec.notes && (
                            <div className="mhm-field-wide">
                              <div className="mhm-field-label">Additional notes</div>
                              <div className="mhm-field-value">{rec.notes}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ fontSize: 12, color: "#888", padding: "12px 0" }}>
                    No medical history records found.
                  </p>
                )}

                <div id="mhm-print-footer">
                  <span>Generated by Petzy Clinic Dashboard</span>
                  <span>{formatDate(new Date())} · {formatTime(new Date())}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalHistoryModal;