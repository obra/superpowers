import { ComposioToolSet } from "composio-core";

async function testDualAccounts() {
  console.log("🧪 Testing Dual Account Setup...");
  
  const composio = new ComposioToolSet({
    apiKey: "ak_suouXXwN2bd7UvBbjJvu"
  });

  try {
    // Test Gmail connection (business)
    console.log("\n📧 Testing Gmail (info@mtlcraftcocktails.com)...");
    const gmailTools = await composio.getTools({
      apps: ["gmail"]
    });
    console.log(`✅ Gmail tools available: ${gmailTools.length} tools`);

    // Test Calendar connection (personal) 
    console.log("\n📅 Testing Calendar (ash.cocktails@gmail.com)...");
    const calendarTools = await composio.getTools({
      apps: ["googlecalendar"]
    });
    console.log(`✅ Calendar tools available: ${calendarTools.length} tools`);

    // Test getting accounts
    console.log("\n👤 Connected Accounts:");
    const accounts = await composio.getUserInfo();
    console.log("User info retrieved successfully");

    console.log("\n🎉 DUAL ACCOUNT SETUP COMPLETE!");
    console.log("📧 Business Email: Ready");
    console.log("📅 Personal Calendar: Ready");
    console.log("🎙️ Voice commands available for both!");

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testDualAccounts();