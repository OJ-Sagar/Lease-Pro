import { Router } from 'express';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import { supabase } from '../../config/supabase.js';
import { asyncHandler, HttpError } from '../../middleware/error.js';

export const reportsRouter = Router();

const reportSources = {
  revenue: 'monthly_revenue',
  ledgers: 'customer_balances',
  leases: 'lease_contracts_overview',
  overdue: 'overdue_accounts'
};

reportsRouter.get('/:type', asyncHandler(async (req, res) => {
  const source = reportSources[req.params.type];
  if (!source) throw new HttpError(404, 'Unknown report type');
  const { data, error } = await supabase.from(source).select('*').limit(5000);
  if (error) throw error;
  res.json({ data });
}));

reportsRouter.get('/:type/export.xlsx', asyncHandler(async (req, res) => {
  const source = reportSources[req.params.type];
  if (!source) throw new HttpError(404, 'Unknown report type');
  const { data, error } = await supabase.from(source).select('*').limit(5000);
  if (error) throw error;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(req.params.type);
  const rows = data || [];
  sheet.columns = Object.keys(rows[0] || { report: 'No data' }).map((key) => ({ header: key, key, width: 24 }));
  rows.forEach((row) => sheet.addRow(row));

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.type}-report.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
}));

reportsRouter.get('/:type/export.pdf', asyncHandler(async (req, res) => {
  const source = reportSources[req.params.type];
  if (!source) throw new HttpError(404, 'Unknown report type');
  const { data, error } = await supabase.from(source).select('*').limit(100);
  if (error) throw error;

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`Lease Pro ${req.params.type} report`, 14, 18);
  doc.setFontSize(9);
  (data || []).slice(0, 40).forEach((row, index) => {
    doc.text(JSON.stringify(row).slice(0, 110), 14, 30 + index * 6);
  });

  const buffer = Buffer.from(doc.output('arraybuffer'));
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.type}-report.pdf"`);
  res.send(buffer);
}));
