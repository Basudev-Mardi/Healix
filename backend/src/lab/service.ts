import { getPool, nextCounter } from "../db/client.js";
import { HttpError } from "../opd/service.js";

function pad(n: number, width = 4): string {
  return String(n).padStart(width, "0");
}

function mapTest(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    testCode: r.test_code as string,
    testName: r.test_name as string,
    category: r.category as string,
    description: r.description as string,
    specimenType: r.specimen_type as string,
    department: r.department as string,
    resultFormat: r.result_format as string,
    unit: r.unit as string,
    refMin: r.ref_min !== null && r.ref_min !== undefined ? Number(r.ref_min) : undefined,
    refMax: r.ref_max !== null && r.ref_max !== undefined ? Number(r.ref_max) : undefined,
    referenceRangeLabel: r.reference_range_label as string,
    price: Number(r.price),
    turnaroundMinutes: Number(r.turnaround_minutes),
    isActive: Boolean(r.is_active),
    createdAt: new Date(r.created_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

function mapRequest(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    patientId: r.patient_id as string,
    patientName: r.patient_name as string,
    referringDoctor: r.referring_doctor as string,
    priority: r.priority as string,
    clinicalNotes: r.clinical_notes as string,
    testIds: (r.test_ids as string[]) ?? [],
    status: r.status as string,
    requestedAt: new Date(r.requested_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

function mapSample(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    requestId: r.request_id as string,
    patientId: r.patient_id as string,
    specimenType: r.specimen_type as string,
    collectedBy: r.collected_by as string,
    collectedAt: new Date(r.collected_at as string).toISOString(),
    status: r.status as string,
    rejectionReason: r.rejection_reason as string,
    notes: r.notes as string,
    trackingHistory: (r.tracking_history as Array<{
      stage: string;
      staff: string;
      timestamp: string;
      note: string;
    }>) ?? [],
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

function mapResult(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    requestId: r.request_id as string,
    sampleId: r.sample_id as string,
    patientId: r.patient_id as string,
    testId: r.test_id as string,
    testCode: r.test_code as string,
    testName: r.test_name as string,
    resultFormat: r.result_format as string,
    resultValue: r.result_value as string,
    unit: r.unit as string,
    referenceRange: r.reference_range as string,
    isOutOfRange: Boolean(r.is_out_of_range),
    remarks: r.remarks as string,
    processedBy: r.processed_by as string,
    processedAt: new Date(r.processed_at as string).toISOString(),
    verificationStatus: r.verification_status as string,
    verifiedBy: (r.verified_by as string | null) ?? undefined,
    verifiedAt: r.verified_at
      ? new Date(r.verified_at as string).toISOString()
      : undefined,
    correctionNotes: r.correction_notes as string,
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

function mapReport(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    requestId: r.request_id as string,
    patientId: r.patient_id as string,
    patientName: r.patient_name as string,
    referringDoctor: r.referring_doctor as string,
    verifiedBy: r.verified_by as string,
    generatedBy: r.generated_by as string,
    generatedAt: new Date(r.generated_at as string).toISOString(),
    reportSnapshot: r.report_snapshot as Record<string, unknown>,
  };
}

export async function getLabState() {
  const pool = getPool();
  const [
    doctorsRes,
    patientsRes,
    testsRes,
    requestsRes,
    samplesRes,
    resultsRes,
    reportsRes,
  ] = await Promise.all([
    pool.query("SELECT id, name, department FROM opd_doctors ORDER BY id ASC"),
    pool.query(
      "SELECT id, full_name, date_of_birth, gender, phone, blood_group FROM patients ORDER BY created_at DESC"
    ),
    pool.query("SELECT * FROM lab_tests ORDER BY test_code ASC"),
    pool.query("SELECT * FROM lab_requests ORDER BY requested_at DESC"),
    pool.query("SELECT * FROM lab_samples ORDER BY collected_at DESC"),
    pool.query("SELECT * FROM lab_results ORDER BY processed_at DESC"),
    pool.query("SELECT * FROM lab_reports ORDER BY generated_at DESC"),
  ]);

  return {
    doctors: doctorsRes.rows,
    patients: patientsRes.rows.map((p) => ({
      id: p.id as string,
      fullName: p.full_name as string,
      dateOfBirth: p.date_of_birth as string,
      gender: p.gender as string,
      phone: p.phone as string,
      bloodGroup: p.blood_group as string,
    })),
    tests: testsRes.rows.map(mapTest),
    requests: requestsRes.rows.map(mapRequest),
    samples: samplesRes.rows.map(mapSample),
    results: resultsRes.rows.map(mapResult),
    reports: reportsRes.rows.map(mapReport),
  };
}

// 1. Test Catalog
export async function createLabTest(input: {
  testCode: string;
  testName: string;
  category: string;
  description?: string;
  specimenType: string;
  department: string;
  resultFormat: "Numerical" | "Qualitative";
  unit?: string;
  refMin?: number | null;
  refMax?: number | null;
  referenceRangeLabel: string;
  price: number;
  turnaroundMinutes: number;
}) {
  if (
    !input.testCode?.trim() ||
    !input.testName?.trim() ||
    !input.category?.trim() ||
    !input.specimenType?.trim() ||
    !input.department?.trim()
  ) {
    throw new HttpError(
      "Test code, name, category, specimen type, and department are required."
    );
  }

  const pool = getPool();
  const dup = await pool.query(
    "SELECT id FROM lab_tests WHERE LOWER(test_code) = LOWER($1)",
    [input.testCode.trim()]
  );
  if ((dup.rowCount ?? 0) > 0) {
    throw new HttpError(
      `Test code "${input.testCode.trim()}" already exists in catalog.`,
      409
    );
  }

  const seq = await nextCounter("lab_test");
  const id = `TST-${pad(seq, 3)}`;
  const res = await pool.query(
    `INSERT INTO lab_tests (
      id, test_code, test_name, category, description, specimen_type, department,
      result_format, unit, ref_min, ref_max, reference_range_label, price, turnaround_minutes, is_active
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,TRUE) RETURNING *`,
    [
      id,
      input.testCode.trim().toUpperCase(),
      input.testName.trim(),
      input.category.trim(),
      input.description?.trim() ?? "",
      input.specimenType.trim(),
      input.department.trim(),
      input.resultFormat || "Numerical",
      input.unit?.trim() ?? "",
      input.refMin !== undefined && input.refMin !== null && !Number.isNaN(Number(input.refMin))
        ? Number(input.refMin)
        : null,
      input.refMax !== undefined && input.refMax !== null && !Number.isNaN(Number(input.refMax))
        ? Number(input.refMax)
        : null,
      input.referenceRangeLabel?.trim() || "Per lab standard",
      Number(input.price || 0),
      Number(input.turnaroundMinutes || 60),
    ]
  );
  return mapTest(res.rows[0]);
}

export async function updateLabTest(input: {
  testId: string;
  isActive?: boolean;
  price?: number;
  turnaroundMinutes?: number;
}) {
  const pool = getPool();
  const res = await pool.query(
    `UPDATE lab_tests
     SET is_active = COALESCE($2, is_active),
         price = COALESCE($3, price),
         turnaround_minutes = COALESCE($4, turnaround_minutes),
         updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [
      input.testId,
      input.isActive !== undefined ? Boolean(input.isActive) : null,
      input.price !== undefined ? Number(input.price) : null,
      input.turnaroundMinutes !== undefined
        ? Number(input.turnaroundMinutes)
        : null,
    ]
  );
  if (res.rowCount === 0) {
    throw new HttpError(`Lab test ${input.testId} not found.`, 404);
  }
  return mapTest(res.rows[0]);
}

// 2. Test Requests (Multiple tests under one request)
export async function createLabRequest(input: {
  patientId: string;
  referringDoctor: string;
  priority: string;
  clinicalNotes?: string;
  testIds: string[];
}) {
  if (
    !input.patientId ||
    !input.referringDoctor?.trim() ||
    !input.testIds?.length
  ) {
    throw new HttpError(
      "Patient, referring doctor, and at least one active test are required."
    );
  }

  const pool = getPool();
  const patRes = await pool.query(
    "SELECT id, full_name FROM patients WHERE id = $1",
    [input.patientId]
  );
  if (patRes.rowCount === 0) {
    throw new HttpError(`Patient ${input.patientId} not found.`, 404);
  }

  const testsRes = await pool.query(
    "SELECT id, is_active FROM lab_tests WHERE id = ANY($1::text[])",
    [input.testIds]
  );
  const activeIds = testsRes.rows
    .filter((t) => t.is_active)
    .map((t) => t.id as string);
  if (activeIds.length !== input.testIds.length) {
    throw new HttpError(
      "One or more selected tests are inactive or do not exist."
    );
  }

  const seq = await nextCounter("lab_request");
  const id = `LAB-${new Date().getFullYear()}-${pad(seq)}`;

  const res = await pool.query(
    `INSERT INTO lab_requests (
      id, patient_id, patient_name, referring_doctor, priority, clinical_notes, test_ids, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,'Pending') RETURNING *`,
    [
      id,
      patRes.rows[0].id,
      patRes.rows[0].full_name,
      input.referringDoctor.trim(),
      input.priority || "Routine",
      input.clinicalNotes?.trim() ?? "",
      input.testIds,
    ]
  );
  return mapRequest(res.rows[0]);
}

export async function updateLabRequestStatus(requestId: string, status: string) {
  const pool = getPool();
  const res = await pool.query(
    `UPDATE lab_requests SET status = $2, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [requestId, status]
  );
  if (res.rowCount === 0) {
    throw new HttpError(`Lab request ${requestId} not found.`, 404);
  }
  return mapRequest(res.rows[0]);
}

// 3. Sample Collection (Prevents duplicate sample records; supports rejection)
export async function collectSample(input: {
  requestId: string;
  specimenType: string;
  collectedBy: string;
  status?: "Collected" | "Rejected";
  rejectionReason?: string;
  notes?: string;
}) {
  if (!input.requestId || !input.specimenType?.trim() || !input.collectedBy?.trim()) {
    throw new HttpError(
      "Lab request, specimen type, and collecting staff are required."
    );
  }

  const pool = getPool();
  const reqRes = await pool.query(
    "SELECT id, patient_id, status FROM lab_requests WHERE id = $1",
    [input.requestId]
  );
  if (reqRes.rowCount === 0) {
    throw new HttpError(`Lab request ${input.requestId} not found.`, 404);
  }
  const req = reqRes.rows[0];
  if (req.status === "Cancelled") {
    throw new HttpError("Cannot collect sample for a cancelled lab request.");
  }

  const dup = await pool.query(
    "SELECT id, status FROM lab_samples WHERE request_id = $1",
    [req.id]
  );
  if ((dup.rowCount ?? 0) > 0) {
    throw new HttpError(
      `Duplicate sample prevented: sample ${dup.rows[0].id} already exists for request ${req.id}.`,
      409
    );
  }

  const initialStatus = input.status === "Rejected" ? "Rejected" : "Collected";
  if (initialStatus === "Rejected" && !input.rejectionReason?.trim()) {
    throw new HttpError(
      "A rejection reason is required when marking a sample as Rejected."
    );
  }

  const seq = await nextCounter("lab_sample");
  const id = `SMP-${new Date().getFullYear()}-${pad(seq)}`;
  const history = [
    {
      stage: initialStatus,
      staff: input.collectedBy.trim(),
      timestamp: new Date().toISOString(),
      note:
        initialStatus === "Rejected"
          ? `Rejected: ${input.rejectionReason?.trim()}`
          : input.notes?.trim() || "Sample collected",
    },
  ];

  const res = await pool.query(
    `INSERT INTO lab_samples (
      id, request_id, patient_id, specimen_type, collected_by,
      status, rejection_reason, notes, tracking_history
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb) RETURNING *`,
    [
      id,
      req.id,
      req.patient_id,
      input.specimenType.trim(),
      input.collectedBy.trim(),
      initialStatus,
      input.rejectionReason?.trim() ?? "",
      input.notes?.trim() ?? "",
      JSON.stringify(history),
    ]
  );

  await pool.query(
    `UPDATE lab_requests SET status = $2, updated_at = NOW() WHERE id = $1`,
    [req.id, initialStatus === "Rejected" ? "Pending" : "Accepted"]
  );

  return mapSample(res.rows[0]);
}

// 4. Sample Tracking (Appends timestamp & staff at every stage)
export async function updateSampleTracking(input: {
  sampleId: string;
  status: "Collected" | "Received" | "Processing" | "Rejected" | "Completed";
  staff: string;
  note?: string;
  rejectionReason?: string;
}) {
  if (input.status === "Rejected" && !input.rejectionReason?.trim()) {
    throw new HttpError("Rejection reason is required when rejecting a sample.");
  }

  const pool = getPool();
  const curRes = await pool.query("SELECT * FROM lab_samples WHERE id = $1", [
    input.sampleId,
  ]);
  if (curRes.rowCount === 0) {
    throw new HttpError(`Sample ${input.sampleId} not found.`, 404);
  }
  const cur = mapSample(curRes.rows[0]);
  const updatedHistory = [
    ...cur.trackingHistory,
    {
      stage: input.status,
      staff: input.staff?.trim() || "Laboratory Staff",
      timestamp: new Date().toISOString(),
      note:
        input.status === "Rejected"
          ? `Rejected: ${input.rejectionReason?.trim()}`
          : input.note?.trim() || `Moved to ${input.status}`,
    },
  ];

  const res = await pool.query(
    `UPDATE lab_samples
     SET status = $2,
         rejection_reason = CASE WHEN $2 = 'Rejected' THEN $3 ELSE rejection_reason END,
         tracking_history = $4::jsonb,
         updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [
      cur.id,
      input.status,
      input.rejectionReason?.trim() ?? "",
      JSON.stringify(updatedHistory),
    ]
  );

  const reqStatusMap: Record<string, string> = {
    Received: "Accepted",
    Processing: "Processing",
    Completed: "Completed",
  };
  if (reqStatusMap[input.status]) {
    await pool.query(
      `UPDATE lab_requests SET status = $2, updated_at = NOW() WHERE id = $1`,
      [cur.requestId, reqStatusMap[input.status]]
    );
  }

  return mapSample(res.rows[0]);
}

// 5. Test Processing (Enter/Update result, auto-evaluate reference range, lock Verified results)
export async function saveTestResult(input: {
  requestId: string;
  testId: string;
  resultValue: string;
  remarks?: string;
  processedBy: string;
  correctionNotes?: string;
}) {
  if (!input.requestId || !input.testId || !input.resultValue?.trim()) {
    throw new HttpError("Lab request, test, and result value are required.");
  }

  const pool = getPool();
  const [reqRes, smpRes, testRes] = await Promise.all([
    pool.query("SELECT * FROM lab_requests WHERE id = $1", [input.requestId]),
    pool.query("SELECT * FROM lab_samples WHERE request_id = $1", [
      input.requestId,
    ]),
    pool.query("SELECT * FROM lab_tests WHERE id = $1", [input.testId]),
  ]);

  if (reqRes.rowCount === 0) {
    throw new HttpError(`Lab request ${input.requestId} not found.`, 404);
  }
  if (smpRes.rowCount === 0) {
    throw new HttpError(
      `No collected sample found for request ${input.requestId}. Collect a sample first.`,
      400
    );
  }
  if (smpRes.rows[0].status === "Rejected") {
    throw new HttpError(
      `Sample ${smpRes.rows[0].id} was rejected and cannot be processed.`,
      409
    );
  }
  if (testRes.rowCount === 0) {
    throw new HttpError(`Test ${input.testId} not found.`, 404);
  }

  const test = mapTest(testRes.rows[0]);
  const sample = mapSample(smpRes.rows[0]);
  const valStr = input.resultValue.trim();

  // Check out-of-range for Numerical tests
  let isOutOfRange = false;
  if (test.resultFormat === "Numerical") {
    const numVal = Number(valStr);
    if (Number.isNaN(numVal)) {
      throw new HttpError(
        `Test "${test.testName}" requires a numerical result value.`
      );
    }
    if (test.refMin !== undefined && numVal < test.refMin) isOutOfRange = true;
    if (test.refMax !== undefined && numVal > test.refMax) isOutOfRange = true;
  } else if (
    test.referenceRangeLabel &&
    valStr.toLowerCase() !== test.referenceRangeLabel.toLowerCase() &&
    (valStr.toLowerCase().includes("positive") ||
      valStr.toLowerCase().includes("growth") ||
      valStr.toLowerCase().includes("detected"))
  ) {
    isOutOfRange = true;
  }

  const existingRes = await pool.query(
    `SELECT * FROM lab_results WHERE request_id = $1 AND test_id = $2`,
    [input.requestId, input.testId]
  );

  let res;
  if ((existingRes.rowCount ?? 0) > 0) {
    const existing = mapResult(existingRes.rows[0]);
    if (existing.verificationStatus === "Verified") {
      throw new HttpError(
        `Result ${existing.id} is already Verified and locked against modification.`,
        409
      );
    }
    if (
      existing.verificationStatus === "Rejected" &&
      !input.correctionNotes?.trim()
    ) {
      throw new HttpError(
        "Correction notes must be documented before re-submitting a rejected result for verification."
      );
    }

    res = await pool.query(
      `UPDATE lab_results
       SET result_value = $3, is_out_of_range = $4, remarks = $5,
           processed_by = $6, processed_at = NOW(), verification_status = 'Pending',
           correction_notes = COALESCE(NULLIF($7, ''), correction_notes),
           updated_at = NOW()
       WHERE request_id = $1 AND test_id = $2 RETURNING *`,
      [
        input.requestId,
        input.testId,
        valStr,
        isOutOfRange,
        input.remarks?.trim() ?? "",
        input.processedBy || "Laboratory Staff",
        input.correctionNotes?.trim() ?? "",
      ]
    );
  } else {
    const seq = await nextCounter("lab_result");
    const id = `RES-${new Date().getFullYear()}-${pad(seq)}`;
    res = await pool.query(
      `INSERT INTO lab_results (
        id, request_id, sample_id, patient_id, test_id, test_code, test_name,
        result_format, result_value, unit, reference_range, is_out_of_range,
        remarks, processed_by, verification_status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'Pending') RETURNING *`,
      [
        id,
        input.requestId,
        sample.id,
        reqRes.rows[0].patient_id,
        test.id,
        test.testCode,
        test.testName,
        test.resultFormat,
        valStr,
        test.unit,
        test.referenceRangeLabel,
        isOutOfRange,
        input.remarks?.trim() ?? "",
        input.processedBy || "Laboratory Staff",
      ]
    );
  }

  await pool.query(
    `UPDATE lab_requests SET status = 'Processing', updated_at = NOW() WHERE id = $1`,
    [input.requestId]
  );

  return mapResult(res.rows[0]);
}

// 6. Result Verification
export async function verifyTestResult(input: {
  resultId: string;
  status: "Verified" | "Rejected";
  verifiedBy: string;
  correctionNotes?: string;
}) {
  const pool = getPool();
  const curRes = await pool.query("SELECT * FROM lab_results WHERE id = $1", [
    input.resultId,
  ]);
  if (curRes.rowCount === 0) {
    throw new HttpError(`Result ${input.resultId} not found.`, 404);
  }
  const cur = mapResult(curRes.rows[0]);
  if (cur.verificationStatus === "Verified") {
    throw new HttpError(
      `Result ${cur.id} is already Verified and cannot be altered.`,
      409
    );
  }
  if (input.status === "Rejected" && !input.correctionNotes?.trim()) {
    throw new HttpError(
      "Correction reason / notes are required when rejecting a result."
    );
  }

  const res = await pool.query(
    `UPDATE lab_results
     SET verification_status = $2,
         verified_by = $3,
         verified_at = NOW(),
         correction_notes = CASE WHEN $2 = 'Rejected' THEN $4 ELSE correction_notes END,
         updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [
      cur.id,
      input.status,
      input.verifiedBy || "Pathologist",
      input.correctionNotes?.trim() ?? "",
    ]
  );

  // If all tests in this request are now Verified, mark sample & request Completed
  if (input.status === "Verified") {
    const reqRes = await pool.query(
      "SELECT test_ids FROM lab_requests WHERE id = $1",
      [cur.requestId]
    );
    const totalTests = (reqRes.rows[0]?.test_ids as string[] | undefined)?.length ?? 0;
    const verifiedRes = await pool.query(
      `SELECT COUNT(*)::int AS cnt FROM lab_results
       WHERE request_id = $1 AND verification_status = 'Verified'`,
      [cur.requestId]
    );
    if (totalTests > 0 && Number(verifiedRes.rows[0].cnt) >= totalTests) {
      await pool.query(
        `UPDATE lab_requests SET status = 'Completed', updated_at = NOW() WHERE id = $1`,
        [cur.requestId]
      );
      await pool.query(
        `UPDATE lab_samples SET status = 'Completed', updated_at = NOW() WHERE request_id = $1`,
        [cur.requestId]
      );
    }
  }

  return mapResult(res.rows[0]);
}

// 7. Digital Reports (Enforces 100% verified results before report generation)
export async function generateDigitalReport(input: {
  requestId: string;
  generatedBy: string;
}) {
  const pool = getPool();
  const [reqRes, patRes, smpRes, resultsRes] = await Promise.all([
    pool.query("SELECT * FROM lab_requests WHERE id = $1", [input.requestId]),
    pool.query(
      `SELECT p.* FROM patients p
       JOIN lab_requests r ON r.patient_id = p.id
       WHERE r.id = $1`,
      [input.requestId]
    ),
    pool.query("SELECT * FROM lab_samples WHERE request_id = $1", [
      input.requestId,
    ]),
    pool.query(
      "SELECT * FROM lab_results WHERE request_id = $1 ORDER BY test_code ASC",
      [input.requestId]
    ),
  ]);

  if (reqRes.rowCount === 0) {
    throw new HttpError(`Lab request ${input.requestId} not found.`, 404);
  }
  const req = mapRequest(reqRes.rows[0]);
  const results = resultsRes.rows.map(mapResult);

  if (results.length < req.testIds.length) {
    throw new HttpError(
      `Cannot generate report: ${req.testIds.length - results.length} test(s) under ${req.id} have not been processed yet.`,
      400
    );
  }
  const unverified = results.filter((r) => r.verificationStatus !== "Verified");
  if (unverified.length > 0) {
    throw new HttpError(
      `Cannot generate report: ${unverified.length} result(s) are not yet Verified (${unverified.map((u) => u.testCode).join(", ")}).`,
      400
    );
  }

  const existing = await pool.query(
    "SELECT * FROM lab_reports WHERE request_id = $1",
    [req.id]
  );
  if ((existing.rowCount ?? 0) > 0) {
    return mapReport(existing.rows[0]);
  }

  const seq = await nextCounter("lab_report");
  const id = `RPT-${new Date().getFullYear()}-${pad(seq)}`;
  const verifiedBy = results[0]?.verifiedBy || "Laboratory Verifier";
  const snapshot = {
    requestId: req.id,
    sampleId: smpRes.rows[0]?.id ?? "",
    specimenType: smpRes.rows[0]?.specimen_type ?? "",
    patient: patRes.rows[0]
      ? {
          id: patRes.rows[0].id,
          fullName: patRes.rows[0].full_name,
          dateOfBirth: patRes.rows[0].date_of_birth,
          gender: patRes.rows[0].gender,
          phone: patRes.rows[0].phone,
        }
      : { id: req.patientId, fullName: req.patientName },
    referringDoctor: req.referringDoctor,
    priority: req.priority,
    clinicalNotes: req.clinicalNotes,
    verifiedBy,
    results,
  };

  const inserted = await pool.query(
    `INSERT INTO lab_reports (
      id, request_id, patient_id, patient_name, referring_doctor,
      verified_by, generated_by, report_snapshot
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb) RETURNING *`,
    [
      id,
      req.id,
      req.patientId,
      req.patientName,
      req.referringDoctor,
      verifiedBy,
      input.generatedBy || "Laboratory Staff",
      JSON.stringify(snapshot),
    ]
  );

  return mapReport(inserted.rows[0]);
}
