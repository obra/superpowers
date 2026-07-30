package com.algoritmonatural.naturaguard.usageaudit

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Process
import android.provider.Settings
import com.algoritmonatural.naturaguard.shared.EventLogger
import com.algoritmonatural.naturaguard.shared.Severity
import com.algoritmonatural.naturaguard.shared.SecurityEvent
import java.util.concurrent.TimeUnit

/**
 * PACKAGE_USAGE_STATS cannot be requested at runtime like a normal
 * permission — it can only be granted by the user, manually, in system
 * Settings. This class never tries to work around that; it only checks
 * whether access was granted and guides the user to the right screen.
 */
class UsageAuditManager(private val context: Context) {

    private val eventLogger = EventLogger(context)

    fun hasUsageAccess(): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = appOps.unsafeCheckOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            Process.myUid(),
            context.packageName,
        )
        return mode == AppOpsManager.MODE_ALLOWED
    }

    fun buildGrantAccessIntent(): Intent =
        Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)

    /**
     * Reads the last 24h of foreground usage, per app, and logs a summary
     * event. Requires hasUsageAccess() == true; callers must check that
     * first and, if false, send the user to buildGrantAccessIntent()
     * instead of silently returning nothing.
     */
    fun auditLast24Hours(): List<AppUsageSummary> {
        check(hasUsageAccess()) {
            "Usage access not granted — call buildGrantAccessIntent() first"
        }

        val usageStatsManager =
            context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val end = System.currentTimeMillis()
        val start = end - TimeUnit.HOURS.toMillis(24)

        val stats = usageStatsManager.queryUsageStats(
            UsageStatsManager.INTERVAL_DAILY,
            start,
            end,
        )

        val summaries = stats
            .filter { it.totalTimeInForeground > 0 }
            .map { AppUsageSummary(it.packageName, it.totalTimeInForeground) }
            .sortedByDescending { it.totalForegroundMillis }

        eventLogger.log(
            SecurityEvent(
                type = "usage_audit_completed",
                severity = Severity.INFO,
                message = "Auditoria de uso das últimas 24h concluída: ${summaries.size} apps com atividade.",
                source = "usageaudit",
            )
        )

        return summaries
    }
}

data class AppUsageSummary(
    val packageName: String,
    val totalForegroundMillis: Long,
)
