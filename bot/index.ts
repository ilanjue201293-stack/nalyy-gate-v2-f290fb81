import "dotenv/config";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  ModalBuilder,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { DurationUnit } from "@prisma/client";
import { prisma } from "../src/lib/server/prisma";
import { calculateExpiry, generateLicenseKey } from "../src/lib/server/access";

const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const appUrl = process.env.APP_URL ?? "http://localhost:8080";
const loaderBaseUrl = process.env.LOADER_BASE_URL ?? appUrl;
const pendingPanels = new Map<string, { title?: string; description?: string }>();
const db = prisma as typeof prisma & {
  guildSetting: {
    findUnique(args: unknown): Promise<{ adminRoleId?: string | null } | null>;
    upsert(args: unknown): Promise<{ adminRoleId?: string | null }>;
  };
  blacklist: {
    create(args: unknown): Promise<{ id: string }>;
    findFirst(args: unknown): Promise<{ reason?: string | null; expiresAt?: Date | null } | null>;
    count(args: unknown): Promise<number>;
  };
  hwidBan: {
    create(args: unknown): Promise<{ id: string }>;
    findFirst(args: unknown): Promise<{ reason?: string | null; expiresAt?: Date | null } | null>;
    count(args: unknown): Promise<number>;
  };
};

if (!token || !clientId) {
  throw new Error("DISCORD_BOT_TOKEN and DISCORD_CLIENT_ID are required to run the bot.");
}

const durationUnitChoices = [
  { name: "minutes", value: "minutes" },
  { name: "hours", value: "hours" },
  { name: "days", value: "days" },
  { name: "weeks", value: "weeks" },
  { name: "months", value: "months" },
] as const;

const commands = [
  new SlashCommandBuilder()
    .setName("admin-role")
    .setDescription("Choose which Discord role can use Nalyy Gate slash commands.")
    .addRoleOption((option) => option.setName("role").setDescription("Admin command role").setRequired(true)),
  new SlashCommandBuilder()
    .setName("link")
    .setDescription("Link a Nalyy Gate script to this Discord server.")
    .addStringOption((option) => option.setName("api_key").setDescription("Script API key").setRequired(true)),
  new SlashCommandBuilder()
    .setName("unlink")
    .setDescription("Unlink a script from this Discord server.")
    .addStringOption((option) =>
      option
        .setName("script")
        .setDescription("Linked script to unlink")
        .setRequired(true)
        .setAutocomplete(true),
    ),
  new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Post a Nalyy Gate script panel in this channel.")
    .addStringOption((option) => option.setName("title").setDescription("Panel title").setRequired(false))
    .addStringOption((option) => option.setName("description").setDescription("Panel description").setRequired(false)),
  new SlashCommandBuilder()
    .setName("edit-panel")
    .setDescription("Save the default panel title and description for a linked script.")
    .addStringOption((option) => option.setName("script").setDescription("Script name").setRequired(true))
    .addStringOption((option) => option.setName("title").setDescription("New default panel title").setRequired(true))
    .addStringOption((option) => option.setName("description").setDescription("New default panel description").setRequired(true)),
  new SlashCommandBuilder()
    .setName("createkey")
    .setDescription("Create one license key for a linked script.")
    .addStringOption((option) => option.setName("script").setDescription("Script name").setRequired(true))
    .addIntegerOption((option) => option.setName("days").setDescription("Duration in days").setRequired(false))
    .addStringOption((option) => option.setName("note").setDescription("Internal note").setRequired(false)),
  new SlashCommandBuilder()
    .setName("generate-bulk-key")
    .setDescription("Generate many keys for the same script.")
    .addStringOption((option) => option.setName("script").setDescription("Script name").setRequired(true))
    .addIntegerOption((option) => option.setName("quantity").setDescription("How many keys").setMinValue(1).setMaxValue(100).setRequired(true))
    .addIntegerOption((option) => option.setName("duration").setDescription("Duration amount").setRequired(false))
    .addStringOption((option) => option.setName("unit").setDescription("Duration unit").addChoices(...durationUnitChoices).setRequired(false))
    .addIntegerOption((option) => option.setName("max_hwids").setDescription("Max HWIDs per key").setMinValue(1).setMaxValue(10).setRequired(false))
    .addStringOption((option) => option.setName("note").setDescription("Internal note").setRequired(false)),
  new SlashCommandBuilder()
    .setName("listkeys")
    .setDescription("List recent keys for a linked script.")
    .addStringOption((option) => option.setName("script").setDescription("Script name").setRequired(true)),
  new SlashCommandBuilder()
    .setName("deletekey")
    .setDescription("Delete a key.")
    .addStringOption((option) => option.setName("key").setDescription("Key value").setRequired(true)),
  new SlashCommandBuilder()
    .setName("edit-key")
    .setDescription("Edit an existing key.")
    .addStringOption((option) => option.setName("key").setDescription("Key value").setRequired(true))
    .addIntegerOption((option) => option.setName("duration").setDescription("New duration amount").setRequired(false))
    .addStringOption((option) => option.setName("unit").setDescription("New duration unit").addChoices(...durationUnitChoices).setRequired(false))
    .addBooleanOption((option) => option.setName("lifetime").setDescription("Make this key lifetime").setRequired(false))
    .addIntegerOption((option) => option.setName("max_hwids").setDescription("Max HWIDs").setMinValue(1).setMaxValue(10).setRequired(false))
    .addBooleanOption((option) => option.setName("revoked").setDescription("Revoke or restore the key").setRequired(false))
    .addStringOption((option) => option.setName("note").setDescription("New internal note").setRequired(false)),
  new SlashCommandBuilder()
    .setName("blacklist")
    .setDescription("Blacklist a user or key from a script.")
    .addStringOption((option) => option.setName("script").setDescription("Script name").setRequired(true))
    .addUserOption((option) => option.setName("user").setDescription("Discord user to blacklist").setRequired(false))
    .addStringOption((option) => option.setName("key").setDescription("Key value to blacklist").setRequired(false))
    .addIntegerOption((option) => option.setName("duration").setDescription("Blacklist duration amount").setRequired(false))
    .addStringOption((option) => option.setName("unit").setDescription("Duration unit").addChoices(...durationUnitChoices).setRequired(false))
    .addStringOption((option) => option.setName("reason").setDescription("Reason").setRequired(false)),
  new SlashCommandBuilder()
    .setName("hwid-ban")
    .setDescription("Ban one HWID from a script.")
    .addStringOption((option) => option.setName("script").setDescription("Script name").setRequired(true))
    .addStringOption((option) => option.setName("hwid").setDescription("HWID to ban").setRequired(true))
    .addIntegerOption((option) => option.setName("duration").setDescription("Ban duration amount").setRequired(false))
    .addStringOption((option) => option.setName("unit").setDescription("Duration unit").addChoices(...durationUnitChoices).setRequired(false))
    .addStringOption((option) => option.setName("reason").setDescription("Reason").setRequired(false)),
  new SlashCommandBuilder()
    .setName("whitelist")
    .setDescription("Whitelist a Discord user for a script.")
    .addStringOption((option) => option.setName("script").setDescription("Script name").setRequired(true))
    .addUserOption((option) => option.setName("user").setDescription("Discord user").setRequired(true)),
  new SlashCommandBuilder()
    .setName("unwhitelist")
    .setDescription("Remove whitelist access for a Discord user.")
    .addStringOption((option) => option.setName("script").setDescription("Script name").setRequired(true))
    .addUserOption((option) => option.setName("user").setDescription("Discord user").setRequired(true)),
  new SlashCommandBuilder()
    .setName("resethwid")
    .setDescription("Reset a user's HWID for a script.")
    .addStringOption((option) => option.setName("script").setDescription("Script name").setRequired(true))
    .addUserOption((option) => option.setName("user").setDescription("Discord user").setRequired(true)),
  new SlashCommandBuilder()
    .setName("scriptstats")
    .setDescription("Show stats for a script.")
    .addStringOption((option) => option.setName("script").setDescription("Script name").setRequired(true)),
  new SlashCommandBuilder()
    .setName("user-info")
    .setDescription("Show detailed Nalyy Gate info for a user on a script.")
    .addStringOption((option) => option.setName("script").setDescription("Script name").setRequired(true))
    .addUserOption((option) => option.setName("user").setDescription("Discord user").setRequired(true)),
].map((command) => command.toJSON());

function requireGuild(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId || !interaction.guild) {
    throw new Error("This command must be used inside a Discord server.");
  }
  return interaction.guildId;
}

function getDuration(interaction: ChatInputCommandInteraction) {
  const amount = interaction.options.getInteger("duration");
  const unit = interaction.options.getString("unit") as DurationUnit | null;
  return {
    amount: amount ?? undefined,
    unit: unit ?? undefined,
    expiresAt: amount && unit ? calculateExpiry(amount, unit) : null,
  };
}

async function assertCommandAccess(interaction: ChatInputCommandInteraction, guildId: string) {
  const canManageGuild = interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ?? false;
  if (interaction.commandName === "admin-role" && canManageGuild) return;

  const setting = await db.guildSetting.findUnique({ where: { guildId } });
  if (!setting?.adminRoleId) {
    if (canManageGuild) return;
    throw new Error("No admin role is configured yet. A server manager must run /admin-role first.");
  }

  const member = await interaction.guild?.members.fetch(interaction.user.id);
  if (!member?.roles.cache.has(setting.adminRoleId) && !canManageGuild) {
    throw new Error("You do not have the Nalyy Gate admin role for slash commands.");
  }
}

async function findGuildScriptByName(scriptName: string, guildId: string) {
  const linkedScripts = await prisma.script.findMany({
    where: { discordGuildId: guildId },
    orderBy: { name: "asc" },
  });
  const normalized = scriptName.trim().toLowerCase();
  const exact = linkedScripts.find((script) => script.name.toLowerCase() === normalized);
  if (exact) return exact;
  return linkedScripts.find((script) => script.name.toLowerCase().includes(normalized)) ?? null;
}

async function assertGuildScriptByName(scriptName: string, guildId: string) {
  const script = await findGuildScriptByName(scriptName, guildId);
  if (!script) throw new Error(`Script "${scriptName}" is not linked to this server.`);
  return script;
}

function scriptButtons(scriptId: string) {
  const main = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`redeem:${scriptId}`).setLabel("Redeem Key").setEmoji("\u{1F511}").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`get:${scriptId}`).setLabel("Get Script").setEmoji("\u{1F4DC}").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`role:${scriptId}`).setLabel("Get Role").setEmoji("\u{1F464}").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`reset:${scriptId}`).setLabel("Reset HWID").setEmoji("\u{2699}\u{FE0F}").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`stats:${scriptId}`).setLabel("Get Stats").setEmoji("\u{1F4CA}").setStyle(ButtonStyle.Secondary),
  );
  const mobile = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`mobile:${scriptId}`).setLabel("Mobile").setEmoji("\u{1F4F1}").setStyle(ButtonStyle.Secondary),
  );
  return [main, mobile];
}

function loaderFor(scriptId: string, keyValue?: string | null) {
  if (!keyValue) return `loadstring(game:HttpGet("${loaderBaseUrl}/api/loader/${scriptId}"))()`;
  return `getgenv().SCRIPT_KEY = "${keyValue}"\nscript_key = getgenv().SCRIPT_KEY\n\nloadstring(game:HttpGet("${loaderBaseUrl}/api/loader/${scriptId}"))()`;
}

function expiresAtLabel(date?: Date | null) {
  return date ? `<t:${Math.floor(date.getTime() / 1000)}:R>` : "Never";
}

function maskKey(key?: string | null) {
  if (!key) return "-";
  return `${key.slice(0, 10)}...${key.slice(-4)}`;
}

async function activeBlacklist(scriptId: string, discordId?: string | null, keyValue?: string | null) {
  return db.blacklist.findFirst({
    where: {
      scriptId,
      active: true,
      OR: [
        discordId ? { discordId } : { id: "__none__" },
        keyValue ? { keyValue } : { id: "__none__" },
      ],
      AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }],
    },
  });
}

async function linkedScriptChoices(guildId: string, query: string) {
  const scripts = await prisma.script.findMany({
    where: {
      discordGuildId: guildId,
      name: query ? { contains: query } : undefined,
    },
    orderBy: { name: "asc" },
    take: 25,
  });
  return scripts.map((script) => ({
    name: `${script.name} (${script.apiKey.slice(0, 10)}...)`,
    value: script.id,
  }));
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async () => {
  const rest = new REST({ version: "10" }).setToken(token);
  await rest.put(Routes.applicationCommands(clientId), { body: [] });
  for (const guild of client.guilds.cache.values()) {
    await rest.put(Routes.applicationGuildCommands(clientId, guild.id), { body: [] });
    await rest.put(Routes.applicationGuildCommands(clientId, guild.id), { body: commands });
  }
  console.log(`Nalyy Gate bot online as ${client.user?.tag}. Global commands cleared, guild commands reset.`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isAutocomplete()) {
      if (!interaction.guildId) return;
      const focused = interaction.options.getFocused(true);
      if (focused.name === "script") {
        await interaction.respond(await linkedScriptChoices(interaction.guildId, String(focused.value ?? "")));
      }
      return;
    }

    if (interaction.isChatInputCommand()) {
      const guildId = requireGuild(interaction);
      await assertCommandAccess(interaction, guildId);

      if (interaction.commandName === "admin-role") {
        const role = interaction.options.getRole("role", true);
        await db.guildSetting.upsert({
          where: { guildId },
          create: { guildId, adminRoleId: role.id },
          update: { adminRoleId: role.id },
        });
        await interaction.reply({ content: `Nalyy Gate slash commands are now limited to ${role}.`, ephemeral: true });
        return;
      }

      if (interaction.commandName === "link") {
        const apiKey = interaction.options.getString("api_key", true);
        const script = await prisma.script.update({
          where: { apiKey },
          data: { discordGuildId: guildId, status: "active" },
        });
        await interaction.reply({ content: `Linked **${script.name}** to this server.`, ephemeral: true });
        return;
      }

      if (interaction.commandName === "unlink") {
        const scriptId = interaction.options.getString("script", true);
        const result = await prisma.script.updateMany({
          where: { id: scriptId, discordGuildId: guildId },
          data: { discordGuildId: null },
        });
        await interaction.reply({
          content: result.count ? "Script unlinked from this server." : "No linked script was found.",
          ephemeral: true,
        });
        return;
      }

      if (interaction.commandName === "panel") {
        const scripts = await prisma.script.findMany({ where: { discordGuildId: guildId } });
        if (scripts.length === 0) {
          await interaction.reply({ content: "No scripts are linked to this server. Use /link with the script API key first.", ephemeral: true });
          return;
        }
        const panelKey = `${interaction.id}:${interaction.user.id}`;
        pendingPanels.set(panelKey, {
          title: interaction.options.getString("title") ?? undefined,
          description: interaction.options.getString("description") ?? undefined,
        });
        const menu = new StringSelectMenuBuilder()
          .setCustomId(`panel:select:${panelKey}`)
          .setPlaceholder("Choose a script")
          .addOptions(scripts.slice(0, 25).map((script) => ({ label: script.name, value: script.id })));
        await interaction.reply({
          content: "Choose which linked script should be posted as a public panel.",
          components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu)],
          ephemeral: true,
        });
        return;
      }

      if (interaction.commandName === "edit-panel") {
        const script = await assertGuildScriptByName(interaction.options.getString("script", true), guildId);
        await (prisma.script as typeof prisma.script & {
          update(args: unknown): Promise<unknown>;
        }).update({
          where: { id: script.id },
          data: {
            panelTitle: interaction.options.getString("title", true),
            panelDescription: interaction.options.getString("description", true),
          },
        });
        await interaction.reply({ content: `Default panel updated for **${script.name}**.`, ephemeral: true });
        return;
      }

      if (interaction.commandName === "createkey" || interaction.commandName === "generate-bulk-key") {
        const script = await assertGuildScriptByName(interaction.options.getString("script", true), guildId);
        const quantity = interaction.commandName === "generate-bulk-key" ? interaction.options.getInteger("quantity", true) : 1;
        const days = interaction.commandName === "createkey" ? interaction.options.getInteger("days") ?? 30 : null;
        const duration = getDuration(interaction);
        const durationAmount = days ?? duration.amount;
        const durationUnit = days ? "days" : duration.unit;
        const maxHwids = interaction.options.getInteger("max_hwids") ?? 1;
        const note = interaction.options.getString("note") ?? `Created from /${interaction.commandName}`;
        const created = await prisma.$transaction(
          Array.from({ length: quantity }, () =>
            prisma.key.create({
              data: {
                scriptId: script.id,
                keyValue: generateLicenseKey(),
                durationAmount,
                durationUnit,
                expiresAt: durationAmount && durationUnit ? calculateExpiry(durationAmount, durationUnit) : null,
                maxHwids,
                note,
              },
            }),
          ),
        );
        const content =
          created.length === 1
            ? `Created key: \`${created[0].keyValue}\``
            : `Created ${created.length} keys for **${script.name}**:\n${created.map((key) => `\`${key.keyValue}\``).join("\n")}`;
        await interaction.reply({ content: content.slice(0, 1900), ephemeral: true });
        return;
      }

      if (interaction.commandName === "listkeys") {
        const script = await assertGuildScriptByName(interaction.options.getString("script", true), guildId);
        const keys = await prisma.key.findMany({ where: { scriptId: script.id }, orderBy: { createdAt: "desc" }, take: 10 });
        await interaction.reply({
          content: keys.length
            ? keys.map((key) => `\`${key.keyValue}\` ${key.revoked ? "revoked" : key.redeemed ? "redeemed" : "unused"} ${expiresAtLabel(key.expiresAt)}`).join("\n")
            : "No keys found.",
          ephemeral: true,
        });
        return;
      }

      if (interaction.commandName === "deletekey") {
        const keyValue = interaction.options.getString("key", true);
        await prisma.key.delete({ where: { keyValue } });
        await interaction.reply({ content: "Key deleted.", ephemeral: true });
        return;
      }

      if (interaction.commandName === "edit-key") {
        const keyValue = interaction.options.getString("key", true);
        const duration = getDuration(interaction);
        const lifetime = interaction.options.getBoolean("lifetime");
        const maxHwids = interaction.options.getInteger("max_hwids");
        const revoked = interaction.options.getBoolean("revoked");
        const note = interaction.options.getString("note");
        const data: {
          durationAmount?: number | null;
          durationUnit?: DurationUnit | null;
          expiresAt?: Date | null;
          lifetime?: boolean;
          maxHwids?: number;
          revoked?: boolean;
          note?: string;
        } = {};
        if (lifetime !== null) {
          data.lifetime = lifetime;
          if (lifetime) {
            data.durationAmount = null;
            data.durationUnit = null;
            data.expiresAt = null;
          }
        }
        if (!data.lifetime && duration.amount && duration.unit) {
          data.durationAmount = duration.amount;
          data.durationUnit = duration.unit;
          data.expiresAt = duration.expiresAt;
        }
        if (maxHwids) data.maxHwids = maxHwids;
        if (revoked !== null) data.revoked = revoked;
        if (note !== null) data.note = note;
        const key = await prisma.key.update({ where: { keyValue }, data });
        await interaction.reply({ content: `Key updated: \`${key.keyValue}\``, ephemeral: true });
        return;
      }

      if (interaction.commandName === "blacklist") {
        const script = await assertGuildScriptByName(interaction.options.getString("script", true), guildId);
        const target = interaction.options.getUser("user");
        const keyValue = interaction.options.getString("key");
        if (!target && !keyValue) throw new Error("Choose a user or a key to blacklist.");
        const duration = getDuration(interaction);
        const reason = interaction.options.getString("reason") ?? "Blacklisted by an admin.";
        await db.blacklist.create({
          data: {
            scriptId: script.id,
            discordId: target?.id ?? null,
            keyValue,
            reason,
            expiresAt: duration.expiresAt,
            createdById: interaction.user.id,
          },
        });
        if (target) {
          await prisma.whitelist.updateMany({
            where: { scriptId: script.id, discordId: target.id },
            data: { active: false },
          });
        }
        if (keyValue) {
          await prisma.key.updateMany({
            where: { scriptId: script.id, keyValue },
            data: { revoked: true },
          });
        }
        await interaction.reply({
          content: `Blacklist added for **${script.name}**.${target ? ` User: ${target}` : ""}${keyValue ? ` Key: \`${maskKey(keyValue)}\`` : ""}\nExpires: ${expiresAtLabel(duration.expiresAt)}\nReason: ${reason}`,
          ephemeral: true,
        });
        return;
      }

      if (interaction.commandName === "hwid-ban") {
        const script = await assertGuildScriptByName(interaction.options.getString("script", true), guildId);
        const hwid = interaction.options.getString("hwid", true);
        const duration = getDuration(interaction);
        const reason = interaction.options.getString("reason") ?? "HWID banned by an admin.";
        await db.hwidBan.create({
          data: {
            scriptId: script.id,
            hwid,
            reason,
            expiresAt: duration.expiresAt,
            createdById: interaction.user.id,
          },
        });
        await interaction.reply({
          content: `HWID banned for **${script.name}**.\nHWID: \`${hwid}\`\nExpires: ${expiresAtLabel(duration.expiresAt)}\nReason: ${reason}`,
          ephemeral: true,
        });
        return;
      }

      if (["whitelist", "unwhitelist", "resethwid", "scriptstats", "user-info"].includes(interaction.commandName)) {
        const script = await assertGuildScriptByName(interaction.options.getString("script", true), guildId);
        const scriptId = script.id;
        const target = interaction.options.getUser("user");

        if (interaction.commandName === "scriptstats") {
          const [keys, whitelist, executions, blacklists, hwidBans] = await Promise.all([
            prisma.key.count({ where: { scriptId } }),
            prisma.whitelist.count({ where: { scriptId, active: true } }),
            prisma.execution.count({ where: { scriptId } }),
            db.blacklist.count({ where: { scriptId, active: true } }),
            db.hwidBan.count({ where: { scriptId, active: true } }),
          ]);
          const embed = new EmbedBuilder()
            .setTitle(`📊 ${script.name} stats`)
            .setColor(0x8b5cf6)
            .addFields(
              { name: "🔑 Keys", value: String(keys), inline: true },
              { name: "✅ Whitelist", value: String(whitelist), inline: true },
              { name: "⚡ Executions", value: String(executions), inline: true },
              { name: "⛔ Blacklists", value: String(blacklists), inline: true },
              { name: "🧬 HWID bans", value: String(hwidBans), inline: true },
              { name: "🧩 Access mode", value: script.accessMode, inline: true },
            )
            .setFooter({ text: "Nalyy Gate" })
            .setTimestamp(new Date());
          await interaction.reply({
            embeds: [embed],
            ephemeral: true,
          });
          return;
        }

        if (!target) throw new Error("User is required.");

        if (interaction.commandName === "user-info") {
          const [row, keys, executions, block] = await Promise.all([
            prisma.whitelist.findUnique({ where: { scriptId_discordId: { scriptId, discordId: target.id } } }),
            prisma.key.findMany({ where: { scriptId, redeemedByDiscordId: target.id }, orderBy: { redeemedAt: "desc" }, take: 5 }),
            prisma.execution.count({ where: { scriptId, discordId: target.id } }),
            activeBlacklist(scriptId, target.id, null),
          ]);
          const embed = new EmbedBuilder()
            .setTitle(`👤 User info: ${target.tag}`)
            .setColor(block ? 0xef4444 : 0x22c55e)
            .setThumbnail(target.displayAvatarURL())
            .addFields(
              { name: "🧩 Script", value: script.name, inline: true },
              { name: "🆔 Discord ID", value: `\`${target.id}\``, inline: true },
              { name: "✅ Whitelist", value: row?.active ? "active" : "inactive", inline: true },
              { name: "🧬 HWID", value: `\`${row?.hwid ?? "not assigned"}\``, inline: false },
              { name: "⏳ Expires", value: expiresAtLabel(row?.expiresAt), inline: true },
              { name: "⚡ Executions", value: String(executions), inline: true },
              { name: "🔑 Keys", value: keys.length ? keys.map((key) => `\`${maskKey(key.keyValue)}\``).join(", ") : "none", inline: false },
              { name: "⛔ Blacklisted", value: block ? `yes${block.reason ? `\n${block.reason}` : ""}` : "no", inline: false },
            )
            .setFooter({ text: "Nalyy Gate" })
            .setTimestamp(new Date());
          await interaction.reply({
            embeds: [embed],
            ephemeral: true,
          });
          return;
        }

        if (interaction.commandName === "whitelist") {
          await prisma.whitelist.upsert({
            where: { scriptId_discordId: { scriptId, discordId: target.id } },
            create: { scriptId, discordId: target.id, active: true, expiresAt: null },
            update: { active: true, expiresAt: null },
          });
          await interaction.reply({ content: `${target} is whitelisted.`, ephemeral: true });
          return;
        }

        if (interaction.commandName === "unwhitelist") {
          await prisma.whitelist.update({
            where: { scriptId_discordId: { scriptId, discordId: target.id } },
            data: { active: false },
          });
          await interaction.reply({ content: `${target} was removed from the whitelist.`, ephemeral: true });
          return;
        }

        await prisma.whitelist.update({
          where: { scriptId_discordId: { scriptId, discordId: target.id } },
          data: { hwid: null },
        });
        await interaction.reply({ content: `${target}'s HWID was reset.`, ephemeral: true });
        return;
      }
    }

    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("panel:select:")) {
      const scriptId = interaction.values[0];
      const script = await prisma.script.findUnique({ where: { id: scriptId } });
      if (!script) throw new Error("Script not found.");
      const panelKey = interaction.customId.slice("panel:select:".length);
      const panelConfig = pendingPanels.get(panelKey);
      pendingPanels.delete(panelKey);
      const scriptWithPanel = script as typeof script & { panelTitle?: string | null; panelDescription?: string | null };
      const embed = new EmbedBuilder()
        .setTitle(panelConfig?.title || scriptWithPanel.panelTitle || `${script.name} Control Panel`)
        .setDescription(
          panelConfig?.description ||
            scriptWithPanel.panelDescription ||
            `This control panel is for the project: **${script.name}**\nIf you're a buyer, click on the buttons below to redeem your key, get the script or get your role.`,
        )
        .setColor(0xf59e0b)
        .setFooter({ text: `Sent by ${interaction.user.tag}` })
        .setTimestamp(new Date());

      if (!interaction.channel || !("send" in interaction.channel)) {
        throw new Error("I cannot post a panel in this channel.");
      }
      await interaction.channel.send({ embeds: [embed], components: scriptButtons(script.id) });
      await interaction.update({ content: `Panel posted for **${script.name}**.`, components: [] });
      return;
    }

    if (interaction.isButton()) {
      const [action, scriptId] = interaction.customId.split(":");
      const script = await prisma.script.findUnique({ where: { id: scriptId } });
      if (!script) throw new Error("Script not found.");

      if (action === "redeem") {
        const modal = new ModalBuilder().setCustomId(`redeem-modal:${scriptId}`).setTitle("Redeem Key");
        const keyInput = new TextInputBuilder()
          .setCustomId("key")
          .setLabel("License key")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);
        modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(keyInput));
        await interaction.showModal(modal);
        return;
      }

      if (action === "get" || action === "mobile") {
        let keyValue: string | null = null;
        let expiresAt: Date | null = null;

        if (await activeBlacklist(scriptId, interaction.user.id, null)) {
          await interaction.reply({ content: "You are blacklisted from this script.", ephemeral: true });
          return;
        }

        if (script.accessMode !== "free") {
          let row = await prisma.whitelist.findUnique({
            where: { scriptId_discordId: { scriptId, discordId: interaction.user.id } },
          });
          let key = await prisma.key.findFirst({
            where: { scriptId, redeemedByDiscordId: interaction.user.id, revoked: false },
            orderBy: { redeemedAt: "desc" },
          });
          if (key?.expiresAt && key.expiresAt < new Date()) key = null;
          if (key && (await activeBlacklist(scriptId, interaction.user.id, key.keyValue))) {
            await interaction.reply({ content: "Your access is blacklisted from this script.", ephemeral: true });
            return;
          }
          const rowActive = () => !!row?.active && (!row.expiresAt || row.expiresAt > new Date());

          if (!rowActive() && script.accessMode === "trial") {
            const usedTrial = await prisma.key.findFirst({
              where: { scriptId, redeemedByDiscordId: interaction.user.id, note: "Trial access" },
            });
            if (usedTrial) {
              await interaction.reply({ content: "Your trial was already used. Redeem a real key or ask to be whitelisted.", ephemeral: true });
              return;
            }
            const expires = calculateExpiry(script.trialDurationAmount ?? 24, script.trialDurationUnit ?? "hours");
            key = await prisma.key.create({
              data: {
                scriptId,
                keyValue: generateLicenseKey("TRIAL"),
                durationAmount: script.trialDurationAmount ?? 24,
                durationUnit: script.trialDurationUnit ?? "hours",
                lifetime: false,
                maxHwids: 1,
                redeemed: true,
                redeemedByDiscordId: interaction.user.id,
                redeemedAt: new Date(),
                expiresAt: expires,
                note: "Trial access",
              },
            });
            row = await prisma.whitelist.upsert({
              where: { scriptId_discordId: { scriptId, discordId: interaction.user.id } },
              create: { scriptId, discordId: interaction.user.id, active: true, expiresAt: expires },
              update: { active: true, expiresAt: expires },
            });
          }

          if (!rowActive()) {
            await interaction.reply({ content: "You are not whitelisted for this script.", ephemeral: true });
            return;
          }

          if (!key) {
            key = await prisma.key.create({
              data: {
                scriptId,
                keyValue: generateLicenseKey(),
                lifetime: true,
                redeemed: true,
                redeemedByDiscordId: interaction.user.id,
                redeemedAt: new Date(),
                note: "Auto-created for manually whitelisted user",
              },
            });
          }
          keyValue = key.keyValue;
          expiresAt = key.expiresAt ?? row?.expiresAt ?? null;
        }

        const loader = loaderFor(scriptId, keyValue);
        const keyLine = keyValue ? `Key expires: ${expiresAtLabel(expiresAt)}` : "Free script: no key required.";
        if (action === "mobile") {
          await interaction.reply({ content: `Here is your mobile loader:\n${keyLine}\n\`\`${loader}\`\``, ephemeral: true });
          return;
        }
        await interaction.reply({ content: `Here is your loader:\n${keyLine}\n\`\`\`lua\n${loader}\n\`\`\``, ephemeral: true });
        return;
      }

      if (action === "role") {
        if (script.accessMode === "free") {
          await interaction.reply({ content: "Free scripts do not grant premium roles.", ephemeral: true });
          return;
        }
        if (await activeBlacklist(scriptId, interaction.user.id, null)) {
          await interaction.reply({ content: "You are blacklisted from this script.", ephemeral: true });
          return;
        }
        const realKey = await prisma.key.findFirst({
          where: { scriptId, redeemedByDiscordId: interaction.user.id, revoked: false, NOT: { note: "Trial access" } },
        });
        if (!realKey) {
          await interaction.reply({ content: "Get Role requires a real key or manual whitelist, not a trial.", ephemeral: true });
          return;
        }
        const row = await prisma.whitelist.findUnique({
          where: { scriptId_discordId: { scriptId, discordId: interaction.user.id } },
        });
        if (!row?.active || !script.discordRoleId || !interaction.guild) {
          await interaction.reply({ content: "Whitelist access or role configuration is missing.", ephemeral: true });
          return;
        }
        const member = await interaction.guild.members.fetch(interaction.user.id);
        await member.roles.add(script.discordRoleId);
        await interaction.reply({ content: "Role granted.", ephemeral: true });
        return;
      }

      if (action === "stats") {
        const [count, row, key, block] = await Promise.all([
          prisma.execution.count({ where: { scriptId } }),
          prisma.whitelist.findUnique({ where: { scriptId_discordId: { scriptId, discordId: interaction.user.id } } }),
          prisma.key.findFirst({ where: { scriptId, redeemedByDiscordId: interaction.user.id, revoked: false }, orderBy: { redeemedAt: "desc" } }),
          activeBlacklist(scriptId, interaction.user.id, null),
        ]);
        const embed = new EmbedBuilder()
          .setTitle(`📊 ${script.name}`)
          .setColor(block ? 0xef4444 : 0x8b5cf6)
          .addFields(
            { name: "⚡ Total executions", value: String(count), inline: true },
            { name: "🧬 HWID status", value: row?.hwid ? "Assigned ✅" : "Not assigned", inline: true },
            { name: "🧩 Access mode", value: script.accessMode, inline: true },
            { name: "🔑 Key", value: `||${key?.keyValue ?? "No key required"}||`, inline: false },
            { name: "⏳ Expires", value: key?.lifetime ? "Never" : expiresAtLabel(key?.expiresAt ?? row?.expiresAt), inline: true },
            { name: "⛔ Blacklisted", value: block ? "Yes" : "No", inline: true },
          )
          .setFooter({ text: `Requested by ${interaction.user.tag}` })
          .setTimestamp(new Date());
        await interaction.reply({
          embeds: [embed],
          ephemeral: true,
        });
        return;
      }

      if (action === "reset") {
        const row = await prisma.whitelist.findUnique({
          where: { scriptId_discordId: { scriptId, discordId: interaction.user.id } },
        });
        if (script.accessMode === "free" && !row) {
          await interaction.reply({ content: "Free scripts do not require a HWID reset.", ephemeral: true });
          return;
        }
        if (!row?.active) {
          await interaction.reply({ content: "You are not whitelisted for this script.", ephemeral: true });
          return;
        }
        await prisma.whitelist.update({ where: { id: row.id }, data: { hwid: null } });
        await interaction.reply({ content: "HWID reset.", ephemeral: true });
        return;
      }
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith("redeem-modal:")) {
      const scriptId = interaction.customId.split(":")[1];
      const keyValue = interaction.fields.getTextInputValue("key");
      const key = await prisma.key.findUnique({ where: { keyValue } });
      if (!key || key.scriptId !== scriptId || key.revoked || (key.expiresAt && key.expiresAt < new Date())) {
        await interaction.reply({ content: "This key is invalid, expired, or not for this script.", ephemeral: true });
        return;
      }
      if (await activeBlacklist(scriptId, interaction.user.id, keyValue)) {
        await interaction.reply({ content: "This user or key is blacklisted from this script.", ephemeral: true });
        return;
      }
      await prisma.$transaction([
        prisma.key.update({
          where: { id: key.id },
          data: { redeemed: true, redeemedByDiscordId: interaction.user.id, redeemedAt: new Date() },
        }),
        prisma.whitelist.upsert({
          where: { scriptId_discordId: { scriptId, discordId: interaction.user.id } },
          create: { scriptId, discordId: interaction.user.id, active: true, expiresAt: key.expiresAt },
          update: { active: true, expiresAt: key.expiresAt },
        }),
      ]);
      await interaction.reply({ content: "Key redeemed. You are now whitelisted.", ephemeral: true });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong.";
    if (interaction.isRepliable()) {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: message, ephemeral: true });
      } else {
        await interaction.reply({ content: message, ephemeral: true });
      }
    }
  }
});

client.login(token);
