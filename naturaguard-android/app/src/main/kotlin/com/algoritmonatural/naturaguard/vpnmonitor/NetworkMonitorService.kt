package com.algoritmonatural.naturaguard.vpnmonitor

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import android.util.Log
import com.algoritmonatural.naturaguard.MainActivity
import com.algoritmonatural.naturaguard.shared.EventLogger
import com.algoritmonatural.naturaguard.shared.Severity
import com.algoritmonatural.naturaguard.shared.SecurityEvent
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.IOException
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.concurrent.thread

/**
 * Local, no-root network monitor. Does NOT decrypt or inspect payloads —
 * reads only IPv4 header fields (protocol, source/destination address) off
 * the TUN interface this VpnService owns, logs anomalies, and writes every
 * packet back out unchanged. This is a monitor, not a firewall: see the
 * mobile-android-agent non-negotiable rule against silently dropping
 * traffic without an explicit, visible block list the user configured.
 */
class NetworkMonitorService : VpnService() {

    companion object {
        private const val TAG = "NaturaGuard/VpnMonitor"
        private const val CHANNEL_ID = "naturaguard_vpn_monitor"
        private const val NOTIFICATION_ID = 1001
        const val ACTION_STOP = "com.algoritmonatural.naturaguard.action.STOP_VPN_MONITOR"
    }

    private var vpnInterface: ParcelFileDescriptor? = null
    private val running = AtomicBoolean(false)
    private lateinit var eventLogger: EventLogger

    override fun onCreate() {
        super.onCreate()
        eventLogger = EventLogger(applicationContext)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopMonitoring()
            return START_NOT_STICKY
        }
        startForeground(NOTIFICATION_ID, buildNotification())
        startMonitoring()
        return START_STICKY
    }

    private fun startMonitoring() {
        if (running.get()) return

        val builder = Builder()
            .setSession("NaturaGuard")
            .addAddress("10.111.222.1", 32)
            .addRoute("0.0.0.0", 0)
            .setMtu(1500)

        vpnInterface = try {
            builder.establish()
        } catch (e: SecurityException) {
            Log.e(TAG, "VPN permission not granted", e)
            eventLogger.log(
                SecurityEvent(
                    type = "vpn_monitor_permission_denied",
                    severity = Severity.WARNING,
                    message = "O utilizador não concedeu permissão de VPN — monitor de rede inativo.",
                    source = "vpnmonitor",
                )
            )
            null
        }

        val fd = vpnInterface ?: return
        running.set(true)

        eventLogger.log(
            SecurityEvent(
                type = "vpn_monitor_started",
                severity = Severity.INFO,
                message = "Monitor de rede local iniciado.",
                source = "vpnmonitor",
            )
        )

        thread(name = "naturaguard-vpn-reader") {
            readLoop(fd)
        }
    }

    /**
     * Pass-through read/write loop: every packet read from the TUN device
     * is inspected at the IPv4-header level only, then written back out
     * unmodified. This keeps the device's normal connectivity working
     * while still observing which remote addresses are being talked to.
     */
    private fun readLoop(fd: ParcelFileDescriptor) {
        val input = FileInputStream(fd.fileDescriptor)
        val output = FileOutputStream(fd.fileDescriptor)
        val buffer = ByteArray(32767)

        while (running.get()) {
            try {
                val length = input.read(buffer)
                if (length <= 0) continue

                inspectPacket(buffer, length)

                output.write(buffer, 0, length)
            } catch (e: IOException) {
                if (running.get()) {
                    Log.w(TAG, "Erro a ler/escrever pacote, a continuar", e)
                }
            }
        }
    }

    private fun inspectPacket(buffer: ByteArray, length: Int) {
        if (length < 20) return // menor que um cabeçalho IPv4 mínimo

        val byteBuffer = ByteBuffer.wrap(buffer, 0, length).order(ByteOrder.BIG_ENDIAN)
        val versionAndIhl = byteBuffer.get(0).toInt() and 0xFF
        val version = versionAndIhl shr 4
        if (version != 4) return // por agora só IPv4; IPv6 fica para iteração seguinte

        val protocol = byteBuffer.get(9).toInt() and 0xFF
        val destAddress = formatIpv4(buffer, 16)

        if (protocol == 6 && isSuspiciousManagementPort(buffer, length)) {
            eventLogger.log(
                SecurityEvent(
                    type = "outbound_management_port",
                    severity = Severity.WARNING,
                    message = "Ligação de saída para porta de gestão (23/3389) detetada.",
                    source = "vpnmonitor",
                    extra = mapOf("destination" to destAddress),
                )
            )
        }
    }

    private fun isSuspiciousManagementPort(buffer: ByteArray, length: Int): Boolean {
        val ihl = (buffer[0].toInt() and 0x0F) * 4
        if (length < ihl + 4) return false
        val destPort = ((buffer[ihl + 2].toInt() and 0xFF) shl 8) or (buffer[ihl + 3].toInt() and 0xFF)
        return destPort == 23 || destPort == 3389 // telnet, RDP
    }

    private fun formatIpv4(buffer: ByteArray, offset: Int): String =
        "${buffer[offset].toInt() and 0xFF}.${buffer[offset + 1].toInt() and 0xFF}." +
            "${buffer[offset + 2].toInt() and 0xFF}.${buffer[offset + 3].toInt() and 0xFF}"

    private fun stopMonitoring() {
        running.set(false)
        vpnInterface?.close()
        vpnInterface = null
        eventLogger.log(
            SecurityEvent(
                type = "vpn_monitor_stopped",
                severity = Severity.INFO,
                message = "Monitor de rede local parado pelo utilizador.",
                source = "vpnmonitor",
            )
        )
        stopSelf()
    }

    override fun onDestroy() {
        stopMonitoring()
        super.onDestroy()
    }

    override fun onRevoke() {
        stopMonitoring()
        super.onRevoke()
    }

    private fun buildNotification(): Notification {
        val notificationManager = getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Monitor de rede NaturaGuard",
                NotificationManager.IMPORTANCE_LOW,
            )
            notificationManager.createNotificationChannel(channel)
        }

        val contentIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE,
        )

        return Notification.Builder(this, CHANNEL_ID)
            .setContentTitle("NaturaGuard")
            .setContentText("A vigiar a rede local deste dispositivo.")
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setContentIntent(contentIntent)
            .setOngoing(true)
            .build()
    }
}
