import { createServer } from "http";
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";
import { execSync } from "child_process";
import {
  Client,
  GatewayIntentBits,
  Message,
  TextChannel,
  ThreadChannel,
} from "discord.js";
import cron from "node-cron";
import { db, tasksTable, threadSettingsTable } from "./db/src";
import { eq, and } from "drizzle-orm";

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

if (!process.env.DISCORD_BOT_TOKEN) {
  throw new Error("DISCORD_BOT_TOKEN environment variable is required.");
}

// ── PID lock: kill any previously running instance ───────────────────────────
const PID_FILE = "/tmp/discord-bot.pid";

if (existsSync(PID_FILE)) {
  try {
    const oldPid = parseInt(readFileSync(PID_FILE, "utf-8").trim(), 10);
    if (!isNaN(oldPid) && oldPid !== process.pid) {
      try {
        process.kill(oldPid, "SIGKILL");
        console.log(`Stopped previous bot instance (PID ${oldPid})`);
      } catch {
        // Process already gone — that's fine
      }
    }
  } catch {
    // Unreadable PID file — ignore
  }
}

writeFileSync(PID_FILE, String(process.pid));

const cleanup = () => {
  try { unlinkSync(PID_FILE); } catch { /* ignore */ }
};
process.on("exit", cleanup);
process.on("SIGTERM", () => { cleanup(); process.exit(0); });
process.on("SIGINT",  () => { cleanup(); process.exit(0); });

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse time strings like "9:00 AM", "9 AM", "21:00", "09:30 PM"
 * Returns { hour, minute } in 24-hour format, or null if invalid.
 */
function parseTime(input: string): { hour: number; minute: number } | null {
  const clean = input.trim().toUpperCase();

  // Match "9:30 AM", "9 AM", "09:00 PM", "21:00", "9:00"
  const match = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = match[2] ? parseInt(match[2], 10) : 0;
  const period = match[3];

  if (minute < 0 || minute > 59) return null;

  if (period === "AM") {
    if (hour === 12) hour = 0;
  } else if (period === "PM") {
    if (hour !== 12) hour += 12;
  }

  if (hour < 0 || hour > 23) return null;

  return { hour, minute };
}

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const m = String(minute).padStart(2, "0");
  return `${h}:${m} ${period}`;
}

async function getOrCreateSettings(
  threadId: string,
  channelId: string,
  guildId: string
) {
  const existing = await db
    .select()
    .from(threadSettingsTable)
    .where(eq(threadSettingsTable.threadId, threadId))
    .limit(1);

  if (existing.length > 0) return existing[0];

  const [created] = await db
    .insert(threadSettingsTable)
    .values({ threadId, channelId, guildId })
    .returning();

  return created;
}

// ── Discord client ───────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("clientReady", () => {
  console.log(`Logged in as ${client.user?.tag}`);
  scheduleDailyReminder();
});

client.on("messageCreate", async (message: Message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith("+")) return;

  const threadId = message.channelId;
  const channelId = message.channelId;
  const guildId = message.guildId ?? "dm";
  const content = message.content.trim();

  // ── +add <task> ─────────────────────────────────────────────────────────
  if (content.startsWith("+add ")) {
    const taskText = content.slice(5).trim();
    if (!taskText) {
      await message.reply("Please provide a task. Usage: `+add <task>`");
      return;
    }
    await db.insert(tasksTable).values({ threadId, channelId, guildId, taskText, completed: false });
    await message.reply(`Task added: **${taskText}**`);
    return;
  }

  // ── +tasks ───────────────────────────────────────────────────────────────
  if (content === "+tasks") {
    const tasks = await db
      .select()
      .from(tasksTable)
      .where(and(eq(tasksTable.threadId, threadId), eq(tasksTable.completed, false)))
      .orderBy(tasksTable.id);

    if (tasks.length === 0) {
      await message.reply("There are no tasks yet.");
      return;
    }
    const list = tasks.map((t, i) => `**${i + 1}.** ${t.taskText}`).join("\n");
    await message.reply(`**Current tasks:**\n${list}`);
    return;
  }

  // ── +done <number> ───────────────────────────────────────────────────────
  if (content.startsWith("+done ")) {
    const num = parseInt(content.slice(6).trim(), 10);
    if (isNaN(num) || num < 1) {
      await message.reply("Please provide a valid task number. Usage: `+done <number>`");
      return;
    }

    const tasks = await db
      .select()
      .from(tasksTable)
      .where(and(eq(tasksTable.threadId, threadId), eq(tasksTable.completed, false)))
      .orderBy(tasksTable.id);

    if (tasks.length === 0) {
      await message.reply("There are no pending tasks in this thread.");
      return;
    }
    if (num > tasks.length) {
      await message.reply(
        `Invalid task number. You have ${tasks.length} pending task(s). Use \`+tasks\` to see them.`
      );
      return;
    }

    const task = tasks[num - 1];
    await db.update(tasksTable).set({ completed: true }).where(eq(tasksTable.id, task.id));
    await message.reply(`Marked as done: ~~${task.taskText}~~`);
    return;
  }

  // ── +set <time> ──────────────────────────────────────────────────────────
  if (content.startsWith("+set ")) {
    const timeStr = content.slice(5).trim();
    const parsed = parseTime(timeStr);

    if (!parsed) {
      await message.reply(
        "Invalid time format. Examples: `+set 9:00 AM`, `+set 2:30 PM`, `+set 21:00`"
      );
      return;
    }

    const settings = await getOrCreateSettings(threadId, channelId, guildId);

    await db
      .update(threadSettingsTable)
      .set({ reminderHour: parsed.hour, reminderMinute: parsed.minute, reminderEnabled: true })
      .where(eq(threadSettingsTable.threadId, threadId));

    await message.reply(
      `Reminder set to **${formatTime(parsed.hour, parsed.minute)}** (Egypt time) for this thread. Reminders are now enabled.`
    );
    return;
  }

  // ── +disable ─────────────────────────────────────────────────────────────
  if (content === "+disable") {
    await getOrCreateSettings(threadId, channelId, guildId);
    await db
      .update(threadSettingsTable)
      .set({ reminderEnabled: false })
      .where(eq(threadSettingsTable.threadId, threadId));

    await message.reply("Reminders have been **disabled** for this thread.");
    return;
  }

  // ── +enable ──────────────────────────────────────────────────────────────
  if (content === "+enable") {
    await getOrCreateSettings(threadId, channelId, guildId);
    await db
      .update(threadSettingsTable)
      .set({ reminderEnabled: true })
      .where(eq(threadSettingsTable.threadId, threadId));

    await message.reply("Reminders have been **enabled** for this thread.");
    return;
  }

  // ── +status ──────────────────────────────────────────────────────────────
  if (content === "+status") {
    const settings = await getOrCreateSettings(threadId, channelId, guildId);
    const pendingCount = await db
      .select()
      .from(tasksTable)
      .where(and(eq(tasksTable.threadId, threadId), eq(tasksTable.completed, false)));

    const statusIcon = settings.reminderEnabled ? "🟢" : "🔴";
    const timeStr = formatTime(settings.reminderHour, settings.reminderMinute);

    await message.reply(
      `**Thread Status**\n` +
      `${statusIcon} Reminders: **${settings.reminderEnabled ? "Enabled" : "Disabled"}**\n` +
      `⏰ Reminder time: **${timeStr}** (Egypt time)\n` +
      `📋 Pending tasks: **${pendingCount.length}**`
    );
    return;
  }
});

// ── Daily reminder scheduler ─────────────────────────────────────────────────
function scheduleDailyReminder() {
  // Runs every minute in Egypt time, checks which threads need a reminder now
  cron.schedule("* * * * *", async () => {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Find all enabled threads whose reminder time matches right now
    const settings = await db
      .select()
      .from(threadSettingsTable)
      .where(
        and(
          eq(threadSettingsTable.reminderEnabled, true),
          eq(threadSettingsTable.reminderHour, currentHour),
          eq(threadSettingsTable.reminderMinute, currentMinute)
        )
      );

    for (const setting of settings) {
      try {
        const tasks = await db
          .select()
          .from(tasksTable)
          .where(and(eq(tasksTable.threadId, setting.threadId), eq(tasksTable.completed, false)))
          .orderBy(tasksTable.id);

        if (tasks.length === 0) continue;

        const channel = await client.channels.fetch(setting.channelId);
        if (!channel || !channel.isTextBased()) continue;

        const list = tasks.map((t, i) => `**${i + 1}.** ${t.taskText}`).join("\n");
        const textChannel = channel as TextChannel | ThreadChannel;
        await textChannel.send(
          `Good morning @everyone! Here are your pending tasks for today:\n${list}`
        );
      } catch (err) {
        console.error(`Failed to send reminder to channel ${setting.channelId}:`, err);
      }
    }
  });
}

client.login(process.env.DISCORD_BOT_TOKEN);
