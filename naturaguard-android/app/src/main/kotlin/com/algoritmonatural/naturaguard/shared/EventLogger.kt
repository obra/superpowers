package com.algoritmonatural.naturaguard.shared

import android.content.Context
import org.json.JSONObject
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/**
 * Severity levels match netguard/netguard.py exactly (crítico/aviso/info),
 * so a report generator can merge events from Termux and this app without
 * a translation layer. See docs added by docs-architecture-agent.
 */
enum class Severity(val wireValue: String) {
    CRITICAL("critico"),
    WARNING("aviso"),
    INFO("info"),
}

data class SecurityEvent(
    val type: String,
    val severity: Severity,
    val message: String,
    val source: String,
    val extra: Map<String, String> = emptyMap(),
)

/**
 * Appends events to events.jsonl in the app's private storage, one JSON
 * object per line — same shape as netguard's events.jsonl so the two logs
 * can be concatenated for a unified report.
 */
class EventLogger(context: Context) {
    private val eventsFile: File = File(context.filesDir, "events.jsonl")
    private val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }

    @Synchronized
    fun log(event: SecurityEvent) {
        val json = JSONObject().apply {
            put("timestamp", isoFormat.format(Date()))
            put("type", event.type)
            put("severity", event.severity.wireValue)
            put("message", event.message)
            put("source", event.source)
            if (event.extra.isNotEmpty()) {
                put("extra", JSONObject(event.extra))
            }
        }
        eventsFile.appendText(json.toString() + "\n")
    }

    fun readAll(): List<String> =
        if (eventsFile.exists()) eventsFile.readLines() else emptyList()
}
