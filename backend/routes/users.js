const express = require('express');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const Standup = require('../models/Standup');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (for leads/admins)
// @access  Private (Lead/Admin only)
router.get('/', protect, authorize('lead', 'admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ name: 1 });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/team
// @desc    Get users by team
// @access  Private (Lead/Admin only)
router.get('/team', protect, authorize('lead', 'admin'), async (req, res) => {
  try {
    const { team } = req.query;
    let query = {};

    if (team) {
      query.team = team;
    }

    const users = await User.find(query).select('-password').sort({ name: 1 });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// configure transporter using environment variables
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: process.env.SMTP_PORT ? 587 : 587,
  secure: process.env.SMTP_SECURE === 'false', // true for 465, false for other ports
  auth: {
    user: "mohitbeniwal@aimantra.co",
    pass: "cizh mbxz kzan bdci" // process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 20000, // Render needs longer timeout
});

// helper to send a single email
async function sendReminderEmail(user) {
  if (!user || !user.email) return;

  const appUrl = 'https://daily-task-manager-seven-mu.vercel.app';
  const displayName = user.name || 'Team member';
  const supportEmail = process.env.SUPPORT_EMAIL || 'mohitbeniwal@aimantra.co';

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"Daily Task Manager" <no-reply@daily-task-manager.example.com>`,
    to: user.email,
    cc: "mohitbeniwal@aimantra.co",
    subject: `Reminder: Please update your tasks for today, ${displayName}`,
    text: `Hello ${displayName},
            This is a friendly reminder to log your tasks for today in the Daily Task Manager.
            Open your task manager: ${appUrl}
            If you need help, contact: ${supportEmail}
            Thanks,
            The Daily Task Manager Team
            `,
    html: `
      <div style="margin:0; padding:0; background: radial-gradient(circle at top, #1d2140 0, #08070f 55%); font-family:Arial, Helvetica, sans-serif; color:#f1f5f9;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td align="center" style="padding:45px 0;">
              
              <div style="
                max-width:620px;
                width:100%;
                background:rgba(255,255,255,0.06);
                backdrop-filter:blur(14px);
                border-radius:14px;
                padding:40px 32px;
                box-shadow:0 0 40px rgba(0,0,0,0.25);
                border:1px solid rgba(255,255,255,0.08);
              ">
                
                <!-- Header -->
                <div style="text-align:center; margin-bottom:30px;">
                  <h1 style="font-size:24px; margin:0; color:#ffffff; font-weight:700; letter-spacing:-0.5px;">
                    Daily Task Manager
                  </h1>
                  <p style="margin-top:6px; color:#cbd5e1; font-size:13px;">
                    Keep your workflow aligned & productive.
                  </p>
                </div>

                <!-- Greeting -->
                <h2 style="margin:0 0 14px; font-size:20px; color:#ffffff; font-weight:600;">
                  Hello ${displayName},
                </h2>

                <p style="margin:0 0 16px; font-size:15px; color:#d1d5db; line-height:1.6;text-align: justify;">
                  This is a quick reminder to update your tasks for today in the <strong style="color:#ffffff;">Daily Task Manager</strong>. 
                  Keeping tasks updated helps the entire team stay on track and maintain smooth workflow.
                </p>
                <div style="
                        background:rgba(255,255,255,0.08);
                        padding:14px 18px;
                        border-radius:8px;
                        margin:18px 0;
                        border-left:4px solid #2563eb;
                      ">
                <p style="margin:0; font-size:15px; color:#e2e8f0;">
                  ⏰ <strong>Please make sure to add your tasks daily before <span style="color:#60a5fa;">10 AM</span>.</strong>
                </p>
                </div>
                <p style="margin:0 0 18px; font-size:15px; color:#d1d5db; line-height:1.6;text-align: justify;">
                  <strong style="color:#ffffff;">Note:</strong> If you are currently on leave, you may skip this email.
                </p>

                <p style="margin:0 0 24px; font-size:15px; color:#d1d5db; line-height:1.6;text-align: justify;">
                  Click the button below to access your dashboard and update your tasks.
                </p>

                <!-- CTA Button -->
                <div style="text-align:center; margin:30px 0;">
                  <a href="${appUrl}" target="_blank" rel="noopener" style="
                    display:inline-block;
                    padding:14px 28px;
                    background:#2563eb;
                    color:#ffffff;
                    text-decoration:none;
                    border-radius:8px;
                    font-weight:600;
                    font-size:15px;
                    box-shadow:0 0 18px rgba(37,99,235,0.45);
                  ">
                    Open Task Dashboard
                  </a>
                </div>

                <!-- Divider -->
                <hr style="border:none; border-top:1px solid rgba(255,255,255,0.15); margin:28px 0;" />

                <!-- Footer -->
                <p style="margin:0 0 10px; font-size:13px; color:#cbd5e1; text-align:center;">
                  Need help? Contact us at  
                  <a href="mailto:${supportEmail}" style="color:#60a5fa; text-decoration:none;">${supportEmail}</a>
                </p>

                <p style="margin:8px 0 0; font-size:12px; color:#94a3b8; text-align:center;">
                  You are receiving this email because you are registered with Daily Task Manager.
                </p>

              </div>

              <p style="margin-top:22px; font-size:11px; color:#64748b; text-align:center;">
                © ${new Date().getFullYear()} Daily Task Manager · All Rights Reserved
              </p>

            </td>
          </tr>
        </table>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
}

// main job: fetch users and send reminders individually
async function sendDailyReminders() {
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch all users except admin/lead
    const users = await User.find({
      role: { $nin: ['lead', 'admin'] }
    }).select('name email role');

    for (const user of users) {
      if (!user.email) continue;

      // Check ONLY today's task
      const hasTaskToday = await Standup.exists({
        user: user._id,
        createdAt: { $gte: today, $lte: tomorrow },
      });

      if (!hasTaskToday) {
        await sendReminderEmail(user);
        console.log(`${user.email} - Reminder sent`);
      } else {
        console.log(`${user.email} - Already added task today`);
      }
    }

    console.log("Daily reminder job completed");
  } catch (err) {
    console.error("Error in reminder job:", err);
  }
}


// scheduled job: runs weekdays (Mon-Fri) at 10:00 (server timezone or specify TIMEZONE env)
const cronSchedule = process.env.REMINDER_CRON || '0 11 * * 1-5'; // default 11:00 Mon-Fri
cron.schedule(cronSchedule, () => {
  sendDailyReminders().catch(console.error);
}, {
  timezone: process.env.TIMEZONE || 'UTC',
});

// optional admin route to trigger reminders manually
router.post('/send-reminders', protect, authorize('lead', 'admin'), async (req, res) => {
  try {
    await sendDailyReminders();
    res.json({ message: 'Reminders sent (or attempted) to all users.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send reminders' });
  }
});

module.exports = router;

