const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

///////////////////////////////////////////////////////////////////////////////
// File: contact.js part of node server routers /api
// New Survey Invites use: ../beta_mail.html 
// Adds Entry in csv: as      
//   'id': '20260313_BETA_000xx', 'email': 'steven.scott.andrew@gmail.com',
//  'status': 'AVAILABLE', 'date_updated': '2026/03/13 17:26' 
//
// History: 
//  2026-06-10 ssandrew updated date format to work with new csv_db.py 
//
// TODO: 
// - Move pw to disk file
///////////////////////////////////////////////////////////////////////////////

// const CSV_PATH = path.join(__dirname, '/home/ssandrew/3d_processor/process_list.csv');
const CSV_PATH = '/home/ssandrew/3d_processor/process_list.csv';

// SMTP Configuration (Moved inside the route or keep as global)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, 
    auth: {        
        user: 'steve.andrew@3dlifestrategies.org', 
        pass: 'ajqenueirlzjpvdc'      
    }
});

router.post('/send-inquiry', (req, res) => {
    console.log(`In: api/send-inquiry`);
    const { firstName, lastName, email, subject, message } = req.body;
    
    const STAFF_SENDERS = [
        'steve.andrew@3dlifestrategies.org',
        'neal.hayes@3dlifestrategies.org',
        'jay.monson@3dlifestrategies.org'
    ];

    const emailClean = (email || '').trim().toLowerCase();

    if (STAFF_SENDERS.includes(emailClean)) {

        console.log(` - STAFF sender detected: ${email}`);

        // -- 1. Extract all email addresses from the message body -----------------
        // RULE: must have at least one name@mail.com in the message
        const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
        const extractedEmails = message.match(emailRegex);
        console.log(` - message: [${message}]`);

        if (!extractedEmails || extractedEmails.length === 0) {
            console.log(' - ERROR: No email addresses found in message body (required).');
            return res.status(400).send("Staff submission requires at least one email address in the message body.");
        }

        console.log(` - extractedEmails: ${JSON.stringify(extractedEmails)}`);
        console.log(` - Extracted emails from message: ${extractedEmails.join(', ')}`);

        // -- 2. Append new rows to data.csv ---------------------------------------
        const today = new Date();
        // const dateStr = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
        // Year/Month/Day HH:MM
        const dateStr = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()} ${today.getHours()}:${today.getMinutes()}`;

        // Build a base ID prefix from today's date: YYYYMMDD
        const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

        // Read and write sequence number from id_number.txt
        // Note: Check your path.join(__dirname) calls to ensure they point 
        // to the right files now that this script is in /routes/          
        // Example fix for path:
        // const ID_NUM_PATH = path.join(__dirname, 'id_number.txt');
        const ID_NUM_PATH = path.join(__dirname, '../id_number.txt');         
        
        let nextSeq = 1;
        if (fs.existsSync(ID_NUM_PATH)) {
            const contents = fs.readFileSync(ID_NUM_PATH, 'utf8').trim();
            const parsed = parseInt(contents, 10);
            if (!isNaN(parsed) && parsed > 0) {
                nextSeq = parsed;
            }
        } else {
            // File doesn't exist yet — create it with 1
            fs.writeFileSync(ID_NUM_PATH, '1', 'utf8');
        }
        console.log(` - Next seq from id_number.txt: ${nextSeq}`);
        // ... (your existing newRows/CSV logic runs here using nextSeq) ...

        // After all rows are built, save the next sequence number back
        const nextSeqAfter = nextSeq + extractedEmails.length;
        fs.writeFileSync(ID_NUM_PATH, String(nextSeqAfter), 'utf8');
        console.log(` - id_number.txt updated to: ${nextSeqAfter}`);

        // Build CSV rows - BETA
		// KEY=BETA
		const KEY="BETA"
        const newRows = extractedEmails.map((emailEntry, i) => {
            const seqStr = String(nextSeq + i).padStart(4, '0');
            const id = `${ymd}_${KEY}_${seqStr}`;
            return `${id},${emailEntry.toLowerCase()},AVAILABLE,${dateStr}`;
        });

        // Write header if file is new/empty
        const csvExists = fs.existsSync(CSV_PATH) && fs.statSync(CSV_PATH).size > 0;
        if (!csvExists) {
            fs.writeFileSync(CSV_PATH, 'id,email,status,date_updated\n', 'utf8');
        }
        fs.appendFileSync(CSV_PATH, newRows.join('\n') + '\n', 'utf8');
        console.log(` - Appended ${newRows.length} row(s) to /home/ssandrew/3d_processor/process_list.csv`);

        // -- 3. Send a welcome email to each new customer -------------------------
        // Build the assigned IDs map: email -> id
        const assignedIds = {};
        extractedEmails.forEach((emailEntry, i) => {
            const seqStr = String(nextSeq + i).padStart(4, '0');
            assignedIds[emailEntry.toLowerCase()] = `${ymd}_${KEY}_${seqStr}`;
        });

		// Read the HTML template once outside the map (more efficient)
        const TEMPLATE_PATH = path.join(__dirname, '../beta_mail.html');
        const htmlTemplate = fs.readFileSync(TEMPLATE_PATH, 'utf8');

        const emailPromises = extractedEmails.map((newCustomerEmail) => {
        const assignedId = assignedIds[newCustomerEmail.toLowerCase()];

        // Inject the assigned ID into the template
        const htmlBody = htmlTemplate.replace(/%ID%/g, assignedId);

        const mailNewCustomer = {
           from: `"3D Life Strategies" <support@3dlifestrategies.org>`,
           to: newCustomerEmail,
           cc: emailClean, 
           subject: `Welcome – Your 3D Life Strategies Beta ID: ${assignedId}`,
           html: htmlBody,                          // ? HTML version
           text: `Welcome to 3D Life Strategies Beta Testing.\n\nYour unique ID is: ${assignedId}\n\nVisit https://3dlifestrategies.org/beta/steps.html to begin.\n\n– The 3D Life Strategies Team`,  // ? plain text fallback
           replyTo: 'support@3dlifestrategies.org'
         };

           return new Promise((resolve, reject) => {
                transporter.sendMail(mailNewCustomer, (error, info) => {
                    if (error) {
                        console.log(`ERROR: - Failed to send to ${newCustomerEmail}:`, error);
                        reject(error);
                    } else {
                        console.log(`OK: -> Sent welcome email to ${newCustomerEmail} (ID: ${assignedId})`);
                        resolve(info);
                    }
                });
            });
        });

        // Send all, collect results (don't fail the whole request if one bounces)
        Promise.allSettled(emailPromises).then((results) => {
            const sent     = results.filter(r => r.status === 'fulfilled').length;
            const failed   = results.filter(r => r.status === 'rejected').length;
            console.log(` - Welcome emails: ${sent} sent, ${failed} failed`);
            return res.status(200).send(
                `Staff submission processed. ${newRows.length} record(s) added to CSV. ${sent} welcome email(s) sent.`
            );
        });
  
        
        // Final logic remains exactly as you wrote it...
        return; 
    }

    // Standard Inquiry Logic
    const mailOptions = {
        from: `"Website Contact" <support@3dlifestrategies.org>`,
        to: 'support@3dlifestrategies.org,steven.scott.andrew@gmail.com',
        subject: `Website Inquiry: ${subject} from: ${email}`,
        text: `Subject: ${subject}\nFrom: ${email}\nName: ${firstName} ${lastName}\nMessage: ${message}`,
        replyTo: email
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            return res.status(500).send("Error sending mail.");
        }
        res.status(200).send("Inquiry sent successfully!");
    });
});

module.exports = router;

