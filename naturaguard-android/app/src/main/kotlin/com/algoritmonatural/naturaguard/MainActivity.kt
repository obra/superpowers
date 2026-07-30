package com.algoritmonatural.naturaguard

import android.app.Activity
import android.app.admin.DevicePolicyManager
import android.content.Intent
import android.net.VpnService
import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import com.algoritmonatural.naturaguard.deviceowner.DeviceOwnerReceiver
import com.algoritmonatural.naturaguard.rootdetection.RootDetector
import com.algoritmonatural.naturaguard.shared.EventLogger
import com.algoritmonatural.naturaguard.usageaudit.UsageAuditManager
import com.algoritmonatural.naturaguard.vpnmonitor.NetworkMonitorService

class MainActivity : Activity() {

    private val vpnPermissionRequestCode = 100

    private lateinit var eventLogger: EventLogger
    private lateinit var statusText: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        eventLogger = EventLogger(applicationContext)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 96, 48, 48)
        }

        statusText = TextView(this).apply {
            text = "NaturaGuard — estado inicial"
        }
        root.addView(statusText)

        root.addView(Button(this).apply {
            text = "Iniciar monitor de rede"
            setOnClickListener { requestVpnPermission() }
        })

        root.addView(Button(this).apply {
            text = "Parar monitor de rede"
            setOnClickListener { stopVpnMonitor() }
        })

        root.addView(Button(this).apply {
            text = "Verificar root"
            setOnClickListener { runRootCheck() }
        })

        root.addView(Button(this).apply {
            text = "Auditoria de uso de apps (24h)"
            setOnClickListener { runUsageAudit() }
        })

        root.addView(Button(this).apply {
            text = "Estado do modo dispositivo dedicado"
            setOnClickListener { checkDeviceOwnerStatus() }
        })

        setContentView(root)
    }

    private fun requestVpnPermission() {
        val intent = VpnService.prepare(this)
        if (intent != null) {
            startActivityForResult(intent, vpnPermissionRequestCode)
        } else {
            onActivityResult(vpnPermissionRequestCode, Activity.RESULT_OK, null)
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == vpnPermissionRequestCode && resultCode == Activity.RESULT_OK) {
            startService(Intent(this, NetworkMonitorService::class.java))
            statusText.text = "Monitor de rede a correr."
        } else if (requestCode == vpnPermissionRequestCode) {
            statusText.text = "Permissão de VPN recusada — monitor de rede inativo."
        }
    }

    private fun stopVpnMonitor() {
        val intent = Intent(this, NetworkMonitorService::class.java).apply {
            action = NetworkMonitorService.ACTION_STOP
        }
        startService(intent)
        statusText.text = "Monitor de rede parado."
    }

    private fun runRootCheck() {
        val suspected = RootDetector(this).checkAndLog()
        statusText.text = if (suspected) {
            "Indícios de root detetados — ver relatório."
        } else {
            "Sem indícios de root."
        }
    }

    private fun runUsageAudit() {
        val manager = UsageAuditManager(this)
        if (!manager.hasUsageAccess()) {
            Toast.makeText(
                this,
                "Conceda acesso a 'Dados de utilização' nas Definições para continuar.",
                Toast.LENGTH_LONG,
            ).show()
            startActivity(manager.buildGrantAccessIntent())
            return
        }
        val summaries = manager.auditLast24Hours()
        statusText.text = "Auditoria concluída: ${summaries.size} apps com atividade nas últimas 24h."
    }

    private fun checkDeviceOwnerStatus() {
        val isOwner = DeviceOwnerReceiver.isDeviceOwner(this)
        statusText.text = if (isOwner) {
            "Este dispositivo está em modo dedicado (Device Owner)."
        } else {
            "Modo dedicado não ativo. Funcionalidades de auditoria de outras apps " +
                "permanecem bloqueadas até este modo ser aprovisionado com consentimento explícito."
        }
    }
}
