import { Router, Response } from 'express';
import { requireAdminAuth, AuthenticatedRequest } from '../middleware/auth';
import { runSecurityBuildValidation, SecurityBuildReport } from '../services/securityBuildValidator';

export const adminSecurityRouter = Router();

// Cache the last validation result in memory
let lastReport: SecurityBuildReport | null = null;
let lastReportRunAt: number = 0;

/**
 * GET /api/admin/security/validate
 * Returns the most recent or cached security build report
 */
adminSecurityRouter.get('/validate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // If report is less than 60 seconds old, return cached, otherwise run
    if (!lastReport || Date.now() - lastReportRunAt > 60000) {
      lastReport = await runSecurityBuildValidation();
      lastReportRunAt = Date.now();
    }

    res.json({
      success: true,
      data: lastReport
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: `Security build validation failed: ${err.message}`
    });
  }
});

/**
 * POST /api/admin/security/run-validation
 * Forces an immediate live execution of the security build validation pipeline
 */
adminSecurityRouter.post('/run-validation', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const report = await runSecurityBuildValidation();
    lastReport = report;
    lastReportRunAt = Date.now();

    res.json({
      success: true,
      message: 'Security build validation executed successfully.',
      data: report
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: `Security build execution error: ${err.message}`
    });
  }
});
