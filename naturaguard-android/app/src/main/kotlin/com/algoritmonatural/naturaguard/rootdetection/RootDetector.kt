package com.algoritmonatural.naturaguard.rootdetection

import android.content.Context
import com.algoritmonatural.naturaguard.shared.EventLogger
import com.algoritmonatural.naturaguard.shared.Severity
import com.algoritmonatural.naturaguard.shared.SecurityEvent
import java.io.File

/**
 * Heuristic root detection. This can be defeated by a determined attacker
 * (root hiding modules exist) — it is a signal, not a guarantee, same
 * honesty standard netguard/README.md holds for its own MAC allow-list.
 * Play Integrity API attestation (server-side) is the stronger check and
 * should be added as a backend call once backend-threat-intel-agent's
 * enrichment pipeline exists; this class only covers the on-device
 * heuristic layer.
 */
class RootDetector(private val context: Context) {

    private val eventLogger = EventLogger(context)

    private val suspiciousPaths = listOf(
        "/system/app/Superuser.apk",
        "/sbin/su",
        "/system/bin/su",
        "/system/xbin/su",
        "/data/local/xbin/su",
        "/data/local/bin/su",
        "/system/sd/xbin/su",
        "/system/bin/failsafe/su",
        "/data/local/su",
        "/su/bin/su",
    )

    fun checkAndLog(): Boolean {
        val suspected = suspiciousPaths.any { File(it).exists() } || hasSuInPath()

        if (suspected) {
            eventLogger.log(
                SecurityEvent(
                    type = "root_suspected",
                    severity = Severity.CRITICAL,
                    message = "Indícios de root detetados neste dispositivo (heurística, não é atestação criptográfica).",
                    source = "rootdetection",
                )
            )
        }
        return suspected
    }

    private fun hasSuInPath(): Boolean {
        val pathEnv = System.getenv("PATH") ?: return false
        return pathEnv.split(":").any { dir -> File(dir, "su").exists() }
    }
}
