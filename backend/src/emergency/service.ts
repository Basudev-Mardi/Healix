import { getPool, nextCounter } from "../db/client.js";
import { HttpError } from "../opd/service.js";

function pad(n: number, width = 4): string {
  return String(n).padStart(width, "0");
}

function mapPatientSummary(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    fullName: r.full_name as string,
    ageOrDob: r.date_of_birth as string,
    gender: r.gender as string,
    phone: r.phone as string,
    bloodGroup: r.blood_group as string,
    allergies: r.allergies as string,
    isUnknown: Boolean(r.is_unknown),
    distinguishingMarks: (r.distinguishing_marks as string) || undefined,
  };
}

function mapRegistration(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    patientId: r.patient_id as string,
    patientName: r.patient_name as string,
    isUnknownIdentity: Boolean(r.is_unknown_identity),
    arrivalTime: new Date(r.arrival_time as string).toISOString(),
    arrivalMode: r.arrival_mode as string,
    emergencyType: r.emergency_type as string,
    presentingComplaints: r.presenting_complaints as string,
    assignedBay: r.assigned_bay as string,
    triageLevel: r.triage_level as string,
    queueStatus: r.queue_status as string,
    registeredBy: r.registered_by as string,
    createdAt: new Date(r.created_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

function mapTriage(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    emergencyId: r.emergency_id as string,
    patientId: r.patient_id as string,
    triageLevel: r.triage_level as string,
    vitals: r.vitals as Record<string, string>,
    symptoms: r.symptoms as string,
    severitySummary: r.severity_summary as string,
    assessmentNotes: r.assessment_notes as string,
    assessedBy: r.assessed_by as string,
    assessedAt: new Date(r.assessed_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

function mapTrauma(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    emergencyId: r.emergency_id as string,
    patientId: r.patient_id as string,
    injuryType: r.injury_type as string,
    severity: r.severity as string,
    mechanismOfInjury: r.mechanism_of_injury as string,
    affectedBodyAreas: r.affected_body_areas as string[],
    airwayStatus: r.airway_status as string,
    bleedingControl: r.bleeding_control as string,
    assessmentNotes: r.assessment_notes as string,
    treatmentProgress: r.treatment_progress as string,
    recordedBy: r.recorded_by as string,
    createdAt: new Date(r.created_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

function mapTreatment(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    emergencyId: r.emergency_id as string,
    patientId: r.patient_id as string,
    attendingDoctor: r.attending_doctor as string,
    emergencyStaffInvolved: r.emergency_staff_involved as string,
    vitals: r.vitals as Record<string, string>,
    diagnosis: r.diagnosis as string,
    observations: r.observations as string,
    treatmentsAndProcedures: r.treatments_and_procedures as string,
    medicationsAdministered: r.medications_administered as string,
    status: r.status as string,
    outcome: r.outcome as string,
    recordedAt: new Date(r.recorded_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

function mapAlert(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    emergencyId: r.emergency_id as string,
    patientId: r.patient_id as string,
    patientName: r.patient_name as string,
    assignedBay: r.assigned_bay as string,
    alertType: r.alert_type as string,
    severity: r.severity as string,
    conditionSummary: r.condition_summary as string,
    notifiedGroups: r.notified_groups as string[],
    status: r.status as string,
    triggeredBy: r.triggered_by as string,
    triggeredAt: new Date(r.triggered_at as string).toISOString(),
    acknowledgedBy: (r.acknowledged_by as string | null) ?? undefined,
    acknowledgedAt: r.acknowledged_at
      ? new Date(r.acknowledged_at as string).toISOString()
      : undefined,
    resolvedBy: (r.resolved_by as string | null) ?? undefined,
    resolvedAt: r.resolved_at
      ? new Date(r.resolved_at as string).toISOString()
      : undefined,
    resolutionNotes: (r.resolution_notes as string | null) ?? undefined,
  };
}

function mapTransfer(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    emergencyId: r.emergency_id as string,
    patientId: r.patient_id as string,
    fromLocation: r.from_location as string,
    destination: r.destination as string,
    targetBedOrUnit: r.target_bed_or_unit as string,
    reason: r.reason as string,
    requestedBy: r.requested_by as string,
    responsibleStaff: r.responsible_staff as string,
    handoverDetails: r.handover_details as string,
    status: r.status as string,
    requestedAt: new Date(r.requested_at as string).toISOString(),
    approvedAt: r.approved_at
      ? new Date(r.approved_at as string).toISOString()
      : undefined,
    transferredAt: r.transferred_at
      ? new Date(r.transferred_at as string).toISOString()
      : undefined,
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

export async function getEmergencyState() {
  const pool = getPool();
  const [
    staffRes,
    patientsRes,
    regsRes,
    triagesRes,
    traumasRes,
    treatmentsRes,
    alertsRes,
    transfersRes,
  ] = await Promise.all([
    pool.query("SELECT * FROM emergency_staff ORDER BY id ASC"),
    pool.query("SELECT * FROM patients ORDER BY created_at DESC"),
    pool.query("SELECT * FROM emergency_registrations ORDER BY created_at DESC"),
    pool.query("SELECT * FROM emergency_triages ORDER BY updated_at DESC"),
    pool.query("SELECT * FROM emergency_traumas ORDER BY created_at DESC"),
    pool.query("SELECT * FROM emergency_treatments ORDER BY recorded_at DESC"),
    pool.query("SELECT * FROM emergency_alerts ORDER BY triggered_at DESC"),
    pool.query("SELECT * FROM emergency_transfers ORDER BY requested_at DESC"),
  ]);

  return {
    staff: staffRes.rows,
    patients: patientsRes.rows.map(mapPatientSummary),
    registrations: regsRes.rows.map(mapRegistration),
    triages: triagesRes.rows.map(mapTriage),
    traumas: traumasRes.rows.map(mapTrauma),
    treatments: treatmentsRes.rows.map(mapTreatment),
    alerts: alertsRes.rows.map(mapAlert),
    transfers: transfersRes.rows.map(mapTransfer),
  };
}

export async function createEmergencyRegistration(input: {
  mode: "existing" | "new" | "unknown";
  existingPatientId?: string;
  newPatient?: {
    fullName: string;
    ageOrDob?: string;
    gender?: string;
    phone: string;
    bloodGroup?: string;
    allergies?: string;
  };
  unknownPatient?: {
    alias?: string;
    estimatedAge?: string;
    gender?: string;
    distinguishingMarks?: string;
  };
  arrivalTime?: string;
  arrivalMode?: string;
  emergencyType?: string;
  presentingComplaints: string;
  assignedBay?: string;
  registeredBy: string;
}) {
  if (!input.presentingComplaints?.trim()) {
    throw new HttpError("Presenting complaints are required.");
  }

  const pool = getPool();
  const year = new Date().getFullYear();
  let patient;

  if (input.mode === "existing") {
    const res = await pool.query("SELECT * FROM patients WHERE id = $1", [
      input.existingPatientId,
    ]);
    if (res.rowCount === 0) {
      throw new HttpError(
        `Existing patient ${input.existingPatientId ?? ""} not found.`,
        404
      );
    }
    patient = mapPatientSummary(res.rows[0]);
  } else if (input.mode === "new") {
    const np = input.newPatient;
    if (!np?.fullName?.trim() || !np.phone?.trim()) {
      throw new HttpError(
        "Full name and contact phone are required for new patient registration."
      );
    }
    const seq = await nextCounter("patient");
    const patId = `PAT-${year}-${pad(seq)}`;
    const res = await pool.query(
      `INSERT INTO patients (id, full_name, date_of_birth, gender, phone, blood_group, allergies, is_unknown)
       VALUES ($1,$2,$3,$4,$5,$6,$7,FALSE) RETURNING *`,
      [
        patId,
        np.fullName.trim(),
        np.ageOrDob?.trim() || "Not provided",
        np.gender || "Other",
        np.phone.trim(),
        np.bloodGroup?.trim() || "Unknown",
        np.allergies?.trim() || "None",
      ]
    );
    patient = mapPatientSummary(res.rows[0]);
  } else {
    const unkSeq = await nextCounter("unknown_patient");
    const patId = `PAT-UNK-${pad(unkSeq)}`;
    const gender = input.unknownPatient?.gender || "Unknown";
    const alias =
      input.unknownPatient?.alias?.trim() ||
      `Unknown ${gender === "Unknown" ? "Patient" : gender} #${unkSeq}`;
    const res = await pool.query(
      `INSERT INTO patients (id, full_name, date_of_birth, gender, phone, blood_group, allergies, is_unknown, distinguishing_marks)
       VALUES ($1,$2,$3,$4,'Unknown','Unknown','Unknown',TRUE,$5) RETURNING *`,
      [
        patId,
        alias,
        input.unknownPatient?.estimatedAge?.trim() || "Unknown",
        gender,
        input.unknownPatient?.distinguishingMarks?.trim() ||
          "Unidentified emergency arrival",
      ]
    );
    patient = mapPatientSummary(res.rows[0]);
  }

  const regSeq = await nextCounter("emergency_registration");
  const regId = `EMG-${year}-${pad(regSeq)}`;
  const emergencyType = input.emergencyType || "General Emergency";
  const assignedBay =
    input.assignedBay?.trim() ||
    (emergencyType === "Trauma"
      ? `Trauma Bay ${((regSeq - 1) % 4) + 1}`
      : `ER Bay ${((regSeq - 1) % 8) + 1}`);

  const regRes = await pool.query(
    `INSERT INTO emergency_registrations (
      id, patient_id, patient_name, is_unknown_identity, arrival_time,
      arrival_mode, emergency_type, presenting_complaints, assigned_bay,
      triage_level, queue_status, registered_by
    ) VALUES ($1,$2,$3,$4,COALESCE($5::timestamptz, NOW()),$6,$7,$8,$9,'Unassessed','Waiting',$10)
    RETURNING *`,
    [
      regId,
      patient.id,
      patient.fullName,
      patient.isUnknown,
      input.arrivalTime || null,
      input.arrivalMode || "Walk-in",
      emergencyType,
      input.presentingComplaints.trim(),
      assignedBay,
      input.registeredBy || "Emergency Staff",
    ]
  );

  return { registration: mapRegistration(regRes.rows[0]), patient };
}

export async function saveTriageAssessment(input: {
  emergencyId: string;
  triageLevel: string;
  vitals: Record<string, string>;
  symptoms: string;
  severitySummary?: string;
  assessmentNotes?: string;
  assessedBy: string;
}) {
  if (!input.emergencyId || !input.triageLevel || !input.symptoms?.trim()) {
    throw new HttpError(
      "Emergency case, triage priority level, and symptoms are required."
    );
  }

  const pool = getPool();
  const regRes = await pool.query(
    "SELECT * FROM emergency_registrations WHERE id = $1",
    [input.emergencyId]
  );
  if (regRes.rowCount === 0) {
    throw new HttpError(
      `Emergency registration ${input.emergencyId} not found.`,
      404
    );
  }
  const reg = regRes.rows[0];

  const existing = await pool.query(
    "SELECT id FROM emergency_triages WHERE emergency_id = $1",
    [input.emergencyId]
  );

  let triageRes;
  if ((existing.rowCount ?? 0) > 0) {
    triageRes = await pool.query(
      `UPDATE emergency_triages
       SET triage_level = $2, vitals = $3::jsonb, symptoms = $4,
           severity_summary = $5, assessment_notes = $6, assessed_by = $7, updated_at = NOW()
       WHERE emergency_id = $1 RETURNING *`,
      [
        input.emergencyId,
        input.triageLevel,
        JSON.stringify(input.vitals),
        input.symptoms.trim(),
        input.severitySummary?.trim() || input.triageLevel,
        input.assessmentNotes?.trim() ?? "",
        input.assessedBy || "Triage Staff",
      ]
    );
  } else {
    const seq = await nextCounter("emergency_triage");
    const triId = `TRI-${new Date().getFullYear()}-${pad(seq)}`;
    triageRes = await pool.query(
      `INSERT INTO emergency_triages (
        id, emergency_id, patient_id, triage_level, vitals, symptoms,
        severity_summary, assessment_notes, assessed_by
      ) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9) RETURNING *`,
      [
        triId,
        reg.id,
        reg.patient_id,
        input.triageLevel,
        JSON.stringify(input.vitals),
        input.symptoms.trim(),
        input.severitySummary?.trim() || input.triageLevel,
        input.assessmentNotes?.trim() ?? "",
        input.assessedBy || "Triage Staff",
      ]
    );
  }

  await pool.query(
    `UPDATE emergency_registrations SET triage_level = $2, updated_at = NOW() WHERE id = $1`,
    [reg.id, input.triageLevel]
  );

  let autoAlert;
  if (input.triageLevel === "Level 1 - Resuscitation") {
    const openAlertRes = await pool.query(
      `SELECT id FROM emergency_alerts WHERE emergency_id = $1 AND status <> 'Resolved'`,
      [reg.id]
    );
    if (openAlertRes.rowCount === 0) {
      const altSeq = await nextCounter("emergency_alert");
      const altId = `ALT-${new Date().getFullYear()}-${pad(altSeq)}`;
      const altRes = await pool.query(
        `INSERT INTO emergency_alerts (
          id, emergency_id, patient_id, patient_name, assigned_bay, alert_type,
          severity, condition_summary, notified_groups, status, triggered_by
        ) VALUES ($1,$2,$3,$4,$5,$6,'Critical',$7,$8,'Unresolved',$9) RETURNING *`,
        [
          altId,
          reg.id,
          reg.patient_id,
          reg.patient_name,
          reg.assigned_bay,
          `Critical Triage (${reg.emergency_type})`,
          `${input.triageLevel}: ${input.symptoms.trim()} (BP ${input.vitals.bloodPressure ?? ""}, SpO2 ${input.vitals.spo2 ?? ""})`,
          ["Emergency Physicians", "Trauma Team", "ICU Team"],
          input.assessedBy || "Triage Assessment",
        ]
      );
      autoAlert = mapAlert(altRes.rows[0]);
    }
  }

  return { triage: mapTriage(triageRes.rows[0]), autoAlert };
}

export async function updateEmergencyQueueStatus(input: {
  emergencyId: string;
  queueStatus: string;
  assignedBay?: string;
}) {
  const pool = getPool();
  const res = await pool.query(
    `UPDATE emergency_registrations
     SET queue_status = $2,
         assigned_bay = COALESCE(NULLIF($3, ''), assigned_bay),
         updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [input.emergencyId, input.queueStatus, input.assignedBay?.trim() ?? ""]
  );
  if (res.rowCount === 0) {
    throw new HttpError(
      `Emergency registration ${input.emergencyId} not found.`,
      404
    );
  }
  return mapRegistration(res.rows[0]);
}

export async function saveTraumaRecord(input: {
  emergencyId: string;
  injuryType: string;
  severity: string;
  mechanismOfInjury: string;
  affectedBodyAreas: string[];
  airwayStatus?: string;
  bleedingControl?: string;
  assessmentNotes?: string;
  treatmentProgress?: string;
  recordedBy: string;
}) {
  if (
    !input.emergencyId ||
    !input.injuryType ||
    !input.mechanismOfInjury?.trim() ||
    !input.affectedBodyAreas?.length
  ) {
    throw new HttpError(
      "Emergency case, injury type, mechanism of injury, and at least one affected body area are required."
    );
  }

  const pool = getPool();
  const regRes = await pool.query(
    "SELECT id, patient_id, queue_status FROM emergency_registrations WHERE id = $1",
    [input.emergencyId]
  );
  if (regRes.rowCount === 0) {
    throw new HttpError(
      `Emergency registration ${input.emergencyId} not found.`,
      404
    );
  }
  const reg = regRes.rows[0];
  const seq = await nextCounter("emergency_trauma");
  const id = `TRM-${new Date().getFullYear()}-${pad(seq)}`;

  const res = await pool.query(
    `INSERT INTO emergency_traumas (
      id, emergency_id, patient_id, injury_type, severity, mechanism_of_injury,
      affected_body_areas, airway_status, bleeding_control, assessment_notes,
      treatment_progress, recorded_by
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [
      id,
      reg.id,
      reg.patient_id,
      input.injuryType,
      input.severity,
      input.mechanismOfInjury.trim(),
      input.affectedBodyAreas,
      input.airwayStatus?.trim() || "Patent",
      input.bleedingControl?.trim() || "None required",
      input.assessmentNotes?.trim() ?? "",
      input.treatmentProgress || "Active Resuscitation",
      input.recordedBy || "Trauma Team",
    ]
  );

  if (reg.queue_status === "Waiting") {
    await pool.query(
      `UPDATE emergency_registrations SET queue_status = 'Under Treatment', updated_at = NOW() WHERE id = $1`,
      [reg.id]
    );
  }

  return mapTrauma(res.rows[0]);
}

export async function updateTraumaProgress(
  traumaId: string,
  treatmentProgress: string
) {
  const pool = getPool();
  const res = await pool.query(
    `UPDATE emergency_traumas SET treatment_progress = $2, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [traumaId, treatmentProgress]
  );
  if (res.rowCount === 0) {
    throw new HttpError(`Trauma record ${traumaId} not found.`, 404);
  }
  return mapTrauma(res.rows[0]);
}

export async function createTreatmentRecord(input: {
  emergencyId: string;
  attendingDoctor: string;
  emergencyStaffInvolved?: string;
  vitals?: Record<string, string>;
  diagnosis: string;
  observations?: string;
  treatmentsAndProcedures: string;
  medicationsAdministered?: string;
  status?: string;
  outcome?: string;
}) {
  if (
    !input.emergencyId ||
    !input.attendingDoctor?.trim() ||
    !input.diagnosis?.trim() ||
    !input.treatmentsAndProcedures?.trim()
  ) {
    throw new HttpError(
      "Emergency case, attending doctor, diagnosis, and treatments/procedures are required."
    );
  }

  const pool = getPool();
  const regRes = await pool.query(
    "SELECT id, patient_id FROM emergency_registrations WHERE id = $1",
    [input.emergencyId]
  );
  if (regRes.rowCount === 0) {
    throw new HttpError(
      `Emergency registration ${input.emergencyId} not found.`,
      404
    );
  }
  const reg = regRes.rows[0];
  const seq = await nextCounter("emergency_treatment");
  const id = `ETR-${new Date().getFullYear()}-${pad(seq)}`;
  const status = input.status || "Ongoing";

  const res = await pool.query(
    `INSERT INTO emergency_treatments (
      id, emergency_id, patient_id, attending_doctor, emergency_staff_involved,
      vitals, diagnosis, observations, treatments_and_procedures,
      medications_administered, status, outcome
    ) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [
      id,
      reg.id,
      reg.patient_id,
      input.attendingDoctor.trim(),
      input.emergencyStaffInvolved?.trim() || "Emergency Care Team",
      JSON.stringify(
        input.vitals ?? {
          bloodPressure: "120/80 mmHg",
          heartRate: "80 bpm",
          spo2: "98%",
          temperature: "98.6 °F",
        }
      ),
      input.diagnosis.trim(),
      input.observations?.trim() ?? "",
      input.treatmentsAndProcedures.trim(),
      input.medicationsAdministered?.trim() || "None",
      status,
      input.outcome?.trim() || "Monitoring in Emergency",
    ]
  );

  const queueMap: Record<string, string> = {
    Ongoing: "Under Treatment",
    Stabilized: "Stabilized",
    "Admitted / Transferred": "Transferred",
    Discharged: "Completed",
    Deceased: "Completed",
  };
  if (queueMap[status]) {
    await pool.query(
      `UPDATE emergency_registrations SET queue_status = $2, updated_at = NOW() WHERE id = $1`,
      [reg.id, queueMap[status]]
    );
  }

  return mapTreatment(res.rows[0]);
}

export async function createCriticalAlert(input: {
  emergencyId: string;
  alertType: string;
  severity?: string;
  conditionSummary: string;
  notifiedGroups?: string[];
  triggeredBy: string;
}) {
  if (
    !input.emergencyId ||
    !input.alertType?.trim() ||
    !input.conditionSummary?.trim()
  ) {
    throw new HttpError(
      "Emergency case, alert type, and condition summary are required."
    );
  }

  const pool = getPool();
  const regRes = await pool.query(
    "SELECT id, patient_id, patient_name, assigned_bay FROM emergency_registrations WHERE id = $1",
    [input.emergencyId]
  );
  if (regRes.rowCount === 0) {
    throw new HttpError(
      `Emergency registration ${input.emergencyId} not found.`,
      404
    );
  }
  const reg = regRes.rows[0];
  const seq = await nextCounter("emergency_alert");
  const id = `ALT-${new Date().getFullYear()}-${pad(seq)}`;

  const res = await pool.query(
    `INSERT INTO emergency_alerts (
      id, emergency_id, patient_id, patient_name, assigned_bay, alert_type,
      severity, condition_summary, notified_groups, status, triggered_by
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Unresolved',$10) RETURNING *`,
    [
      id,
      reg.id,
      reg.patient_id,
      reg.patient_name,
      reg.assigned_bay,
      input.alertType.trim(),
      input.severity || "Critical",
      input.conditionSummary.trim(),
      input.notifiedGroups?.length
        ? input.notifiedGroups
        : ["Emergency Physicians"],
      input.triggeredBy || "Emergency Staff",
    ]
  );

  return mapAlert(res.rows[0]);
}

export async function updateCriticalAlert(input: {
  alertId: string;
  action: "acknowledge" | "resolve";
  actor: string;
  resolutionNotes?: string;
}) {
  const pool = getPool();
  const res =
    input.action === "acknowledge"
      ? await pool.query(
          `UPDATE emergency_alerts
           SET status = 'Acknowledged', acknowledged_by = $2, acknowledged_at = NOW()
           WHERE id = $1 RETURNING *`,
          [input.alertId, input.actor || "Emergency Staff"]
        )
      : await pool.query(
          `UPDATE emergency_alerts
           SET status = 'Resolved', resolved_by = $2, resolved_at = NOW(), resolution_notes = $3
           WHERE id = $1 RETURNING *`,
          [
            input.alertId,
            input.actor || "Emergency Staff",
            input.resolutionNotes?.trim() || "Patient condition stabilized",
          ]
        );

  if (res.rowCount === 0) {
    throw new HttpError(`Alert ${input.alertId} not found.`, 404);
  }
  return mapAlert(res.rows[0]);
}

export async function createTransferRequest(input: {
  emergencyId: string;
  destination: string;
  targetBedOrUnit?: string;
  reason: string;
  requestedBy: string;
  responsibleStaff: string;
  handoverDetails?: string;
}) {
  if (
    !input.emergencyId ||
    !input.destination ||
    !input.reason?.trim() ||
    !input.responsibleStaff?.trim()
  ) {
    throw new HttpError(
      "Emergency case, destination, transfer reason, and responsible staff are required."
    );
  }

  const pool = getPool();
  const regRes = await pool.query(
    "SELECT id, patient_id, assigned_bay FROM emergency_registrations WHERE id = $1",
    [input.emergencyId]
  );
  if (regRes.rowCount === 0) {
    throw new HttpError(
      `Emergency registration ${input.emergencyId} not found.`,
      404
    );
  }
  const reg = regRes.rows[0];
  const seq = await nextCounter("emergency_transfer");
  const id = `TRF-${new Date().getFullYear()}-${pad(seq)}`;

  const res = await pool.query(
    `INSERT INTO emergency_transfers (
      id, emergency_id, patient_id, from_location, destination, target_bed_or_unit,
      reason, requested_by, responsible_staff, handover_details, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'Requested') RETURNING *`,
    [
      id,
      reg.id,
      reg.patient_id,
      reg.assigned_bay,
      input.destination,
      input.targetBedOrUnit?.trim() || `${input.destination} Receiving`,
      input.reason.trim(),
      input.requestedBy || "Emergency Staff",
      input.responsibleStaff.trim(),
      input.handoverDetails?.trim() ||
        "Full emergency triage and treatment records handed over.",
    ]
  );

  return mapTransfer(res.rows[0]);
}

export async function updateTransferStatus(input: {
  transferId: string;
  status: string;
  handoverDetails?: string;
  targetBedOrUnit?: string;
}) {
  const pool = getPool();
  const res = await pool.query(
    `UPDATE emergency_transfers
     SET status = $2,
         handover_details = COALESCE(NULLIF($3, ''), handover_details),
         target_bed_or_unit = COALESCE(NULLIF($4, ''), target_bed_or_unit),
         approved_at = CASE WHEN $2 = 'Approved' THEN NOW() ELSE approved_at END,
         transferred_at = CASE WHEN $2 = 'Completed' THEN NOW() ELSE transferred_at END,
         updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [
      input.transferId,
      input.status,
      input.handoverDetails?.trim() ?? "",
      input.targetBedOrUnit?.trim() ?? "",
    ]
  );
  if (res.rowCount === 0) {
    throw new HttpError(`Transfer ${input.transferId} not found.`, 404);
  }
  const transfer = mapTransfer(res.rows[0]);

  if (input.status === "Completed") {
    await pool.query(
      `UPDATE emergency_registrations SET queue_status = 'Transferred', updated_at = NOW() WHERE id = $1`,
      [transfer.emergencyId]
    );
  }

  return transfer;
}
