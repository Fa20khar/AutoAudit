/**
 * AutoAudit - CLI Script to Validate Security Build
 * Usage: npm run validate:security-build
 */
import { runSecurityBuildValidation } from '../services/securityBuildValidator';

async function main() {
  console.log('================================================================');
  console.log('🛡️  AutoAudit — Security Build & Subsystem Validation Pipeline');
  console.log('================================================================\n');

  try {
    const report = await runSecurityBuildValidation();

    console.log(`Timestamp:        ${report.timestamp}`);
    console.log(`Environment:      ${report.environment.nodeEnv}`);
    console.log(`Node Version:     ${report.environment.nodeVersion}`);
    console.log(`JWT Configured:   ${report.environment.jwtConfigured ? 'Yes (>=32 chars)' : 'No (Runtime Ephemeral)'}`);
    console.log(`MongoDB Connected:${report.environment.mongoConnected ? 'Yes (Atlas)' : 'No (Memory fallback)'}`);
    console.log(`Execution Time:   ${report.executionTimeMs}ms\n`);

    console.log('--- Itemized Security Checks ---');
    for (const check of report.checks) {
      const icon = check.status === 'passed' ? '✅' : check.status === 'warning' ? '⚠️ ' : '❌';
      console.log(`${icon} [${check.category.toUpperCase()}] ${check.name}`);
      console.log(`   Status:   ${check.status.toUpperCase()} (Severity: ${check.severity})`);
      console.log(`   Details:  ${check.details}`);
    }

    console.log('\n================================================================');
    console.log(`📊 Summary: ${report.passedChecks}/${report.totalChecks} Checks Passed (${report.warningChecks} Warnings, ${report.failedChecks} Failures)`);
    console.log(`🏁 Overall Security Build Status: ${report.overallStatus}`);
    console.log('================================================================\n');

    if (report.overallStatus === 'FAILED') {
      console.error('❌ Security build validation FAILED. Gating deployment.');
      process.exit(1);
    } else {
      console.log('✅ Security build verification PASSED. Safe for deployment.');
      process.exit(0);
    }
  } catch (err: any) {
    console.error('Fatal error during security build validation:', err);
    process.exit(1);
  }
}

main();
