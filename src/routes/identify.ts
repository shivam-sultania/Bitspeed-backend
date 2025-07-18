import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

router.post("/identify", async (req, res) => {
  const { email, phoneNumber } = req.body;

  if (!email && !phoneNumber) {
    return res.status(400).json({ error: "Either email or phoneNumber is required." });
  }

  // Get directly matching contacts
  const matches = await prisma.contact.findMany({
    where: {
      OR: [
        { email: email ?? undefined },
        { phoneNumber: phoneNumber ?? undefined }
      ]
    },
    orderBy: { createdAt: "asc" }
  });

  // If no matches, create a new primary contact
  if (matches.length === 0) {
    const newContact = await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkPrecedence: "primary",
        linkedId: null,
        deletedAt: null
      }
    });

    return res.status(200).json({
      contact: {
        primaryContactId: newContact.id,
        emails: [newContact.email].filter(Boolean),
        phoneNumbers: [newContact.phoneNumber].filter(Boolean),
        secondaryContactIds: []
      }
    });
  }

  // Get all primary IDs involved
  const primaryIds = new Set<number>();
  for (const contact of matches) {
    if (contact.linkPrecedence === "primary") {
      primaryIds.add(contact.id);
    } else if (contact.linkedId) {
      primaryIds.add(contact.linkedId);
    }
  }

  // Fetch all related contacts once
  const linkedContact = await prisma.contact.findMany({
    where: {
      OR: [
        { id: { in: Array.from(primaryIds) } },
        { linkedId: { in: Array.from(primaryIds) } }
      ]
    },
    orderBy: { createdAt: "asc" }
  });

  // Determine the correct new primary (oldest primary contact)
  const primaries = linkedContact.filter(c => c.linkPrecedence === "primary");
  const newPrimary = primaries.reduce((oldest, current) => {
    return new Date(current.createdAt) < new Date(oldest.createdAt) ? current : oldest;
  });

  const contactsMap = new Map<number, any>();
  const queries: any[] = [];

  for (const contact of linkedContact) {
    if (contact.id === newPrimary.id) {
      if (contact.linkPrecedence !== "primary" || contact.linkedId !== null) {
        queries.push(
          prisma.contact.update({
            where: { id: contact.id },
            data: { linkPrecedence: "primary", linkedId: null }
          })
        );
        contactsMap.set(contact.id, {
          ...contact,
          linkPrecedence: "primary",
          linkedId: null
        });
      } else {
        contactsMap.set(contact.id, contact);
      }
    } else {
      if (contact.linkPrecedence !== "secondary" || contact.linkedId !== newPrimary.id) {
        queries.push(
          prisma.contact.update({
            where: { id: contact.id },
            data: { linkPrecedence: "secondary", linkedId: newPrimary.id }
          })
        );
        contactsMap.set(contact.id, {
          ...contact,
          linkPrecedence: "secondary",
          linkedId: newPrimary.id
        });
      } else {
        contactsMap.set(contact.id, contact);
      }
    }
  }

  // If current email+phone combo doesn't exist, add it
  let newContact = null;
  const existingCombo = linkedContact.find(
    c => c.email === email && c.phoneNumber === phoneNumber
  );

  if (!existingCombo && (email || phoneNumber)) {
    const created = await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkPrecedence: "secondary",
        linkedId: newPrimary.id,
        deletedAt: null
      }
    });
    newContact = created;
  }

  // Execute pending updates
  await Promise.all(queries);

  // Final list of contacts = updated + new inserted (no need to query DB again)
  const finalContacts = [...contactsMap.values()];
  if (newContact) finalContacts.push(newContact);

  const emails = new Set<string>();
  const phoneNumbers = new Set<string>();
  const secondaryContactIds: number[] = [];

  for (const c of finalContacts) {
    if (c.email) emails.add(c.email);
    if (c.phoneNumber) phoneNumbers.add(c.phoneNumber);
    if (c.linkPrecedence === "secondary") secondaryContactIds.push(c.id);
  }

  return res.status(200).json({
    contact: {
      primaryContactId: newPrimary.id,
      emails: [newPrimary.email, ...Array.from(emails).filter(e => e !== newPrimary.email)],
      phoneNumbers: [newPrimary.phoneNumber, ...Array.from(phoneNumbers).filter(p => p !== newPrimary.phoneNumber)],
      secondaryContactIds: secondaryContactIds
    }
  });
});

export default router;
