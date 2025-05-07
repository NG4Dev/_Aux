import { Request, Response } from "express";
import { db } from "../../db/index";
import { qrScans } from "../../db/entities/qrScansSchema";
import { eq } from "drizzle-orm";

export async function listQrScans(req: Request, res: Response) {
  try {
    const qrScanList = await db
    .select()
    .from(qrScans);

    res.json(qrScanList);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function getQrScanById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [qrScan] = await db
      .select()
      .from(qrScans)
      .where(eq(qrScans.id, id));

    if (!qrScan){
        res.status(404).send({message: "QR scan not found"});
    } else {
        res.json(qrScan);
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function createQrScan(req: Request, res: Response) {
  try {
    // Basic validation/typing might be needed for req.body
    const [qrScan] = await db
      .insert(qrScans)
      .values(req.body) // Assuming req.body matches the qrScans schema structure
      .returning();
    res.status(201).json(qrScan);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function updateQrScan(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const updatedFields = req.body; // Assuming req.body contains fields to update

    const [qrScan] = await db
    .update(qrScans)
    .set(updatedFields)
    .where(eq(qrScans.id, id))
    .returning();

    if (qrScan) {
        res.json(qrScan);
    } else {
        res.status(404).send({message: "QR scan was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function deleteQrScan(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [deletedQrScan] = await db
    .delete(qrScans)
    .where(eq(qrScans.id, id))
    .returning();

    if (deletedQrScan) {
        res.status(204).send();
    } else {
        res.status(404).send({message: "QR scan was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}
