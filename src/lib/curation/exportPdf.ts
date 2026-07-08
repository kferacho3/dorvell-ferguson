import type { CurationPhoto, CurationState } from "@/lib/curation/types";
import { buildReportPayload } from "@/lib/curation/exportMarkdown";
import { validateForFinalization } from "@/lib/curation/validation";

/**
 * Clean, readable PDF companion of the markdown report. No full-size images —
 * summary counters, validation status, breakdowns, and the decision table.
 * jspdf is loaded on demand so it never enters the public bundles.
 */
export async function exportPdfReport(
  photos: CurationPhoto[],
  state: CurationState,
  exportedAt: string,
): Promise<void> {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const autoTable = autoTableModule.default;

  const payload = buildReportPayload(photos, state, exportedAt);
  const { summary } = payload;
  const validation = validateForFinalization(photos, state.decisions);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 44;

  const ink: [number, number, number] = [24, 20, 18];
  const brown: [number, number, number] = [58, 37, 31];
  const teal: [number, number, number] = [14, 98, 94];
  const soft: [number, number, number] = [122, 112, 104];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...ink);
  doc.text("Dorvell Ferguson — Photo Curation Report", margin, 64);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...soft);
  doc.text(`Exported ${exportedAt}`, margin, 82);
  doc.text(`Schema ${payload.schema}`, margin, 96);

  const status = payload.finalized
    ? "FINALIZED"
    : validation.readyToFinalize
      ? "READY TO FINALIZE"
      : "DRAFT";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...(payload.finalized || validation.readyToFinalize ? teal : brown));
  doc.text(`Status: ${status}`, pageWidth - margin, 82, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...soft);
  doc.text(
    `Blocked items: ${validation.blockers.length + validation.unreviewed.length}`,
    pageWidth - margin,
    96,
    { align: "right" },
  );

  autoTable(doc, {
    startY: 116,
    margin: { left: margin, right: margin },
    head: [["Total", "Reviewed", "Remaining", "Kept", "Scrapped", "Categorized", "Portfolio", "Modeling", "Projects", "Complete"]],
    body: [[
      summary.total,
      summary.reviewed,
      summary.remaining,
      summary.kept,
      summary.scrapped,
      summary.categorized,
      summary.portfolio,
      summary.modeling,
      summary.projects,
      `${summary.percentComplete}%`,
    ]],
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 6, textColor: ink },
    headStyles: { fillColor: brown, textColor: [246, 239, 228], fontStyle: "bold" },
  });

  const categoryRows = Object.entries(payload.categories)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => [name, String(count)]);
  if (categoryRows.length > 0) {
    autoTable(doc, {
      startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18,
      margin: { left: margin, right: margin },
      head: [["Category (kept photos)", "Count"]],
      body: categoryRows,
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 5, textColor: ink },
      headStyles: { fillColor: teal, textColor: [246, 239, 228], fontStyle: "bold" },
      tableWidth: (pageWidth - margin * 2) / 2,
    });
  }

  autoTable(doc, {
    startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18,
    margin: { left: margin, right: margin },
    head: [["Filename", "Status", "Primary category", "Tags", "Pf", "Md", "Pj", "Scrap reason", "Notes"]],
    body: payload.photos.map((d) => [
      d.filename,
      d.status.toUpperCase(),
      d.category_primary ?? "—",
      d.category_tags.join(", "),
      d.portfolio_assigned ? "Y" : "",
      d.model_assigned ? "Y" : "",
      d.project_assigned ? "Y" : "",
      d.status === "scrapped" ? d.scrap_reason || "" : "",
      d.notes,
    ]),
    theme: "striped",
    styles: { fontSize: 7, cellPadding: 3, textColor: ink, overflow: "linebreak" },
    headStyles: { fillColor: brown, textColor: [246, 239, 228], fontStyle: "bold", fontSize: 7.5 },
    columnStyles: {
      0: { cellWidth: 128 },
      4: { cellWidth: 18 },
      5: { cellWidth: 18 },
      6: { cellWidth: 18 },
    },
    didDrawPage: () => {
      const pageNumber = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(...soft);
      doc.text(
        `Dorvell Ferguson Photo Curation — page ${pageNumber}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 20,
        { align: "center" },
      );
    },
  });

  doc.save("photos_report.pdf");
}
