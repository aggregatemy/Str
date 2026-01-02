import { Database } from 'better-sqlite3';

export interface LegalUpdateRow {
  id: string;
  eli_uri: string | null;
  ingest_method: 'eli' | 'rss' | 'scraper';
  title: string;
  summary: string;
  date: string;
  impact: 'low' | 'medium' | 'high';
  category: string;
  legal_status: string;
  official_rationale: string;
  source_url: string | null;
  raw_data: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttachmentRow {
  id: number;
  legal_update_id: string;
  filename: string;
  content: Buffer;
  mime_type: string | null;
  created_at: string;
}

export class DatabaseSchema {
  constructor(private db: Database) {}

  insertLegalUpdate(update: Omit<LegalUpdateRow, 'created_at' | 'updated_at'>) {
    const stmt = this.db.prepare(`
      INSERT INTO legal_updates (
        id, eli_uri, ingest_method, title, summary, date,
        impact, category, legal_status, official_rationale,
        source_url, raw_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    return stmt.run(
      update.id,
      update.eli_uri,
      update.ingest_method,
      update.title,
      update.summary,
      update.date,
      update.impact,
      update.category,
      update.legal_status,
      update.official_rationale,
      update.source_url,
      update.raw_data
    );
  }

  getLegalUpdateById(id: string): LegalUpdateRow | undefined {
    const stmt = this.db.prepare('SELECT * FROM legal_updates WHERE id = ?');
    return stmt.get(id) as LegalUpdateRow | undefined;
  }

  getAllLegalUpdates(filters?: {
    ingestMethod?: string;
    dateFrom?: string;
    dateTo?: string;
  }): LegalUpdateRow[] {
    let query = 'SELECT * FROM legal_updates WHERE 1=1';
    const params: any[] = [];

    if (filters?.ingestMethod) {
      query += ' AND ingest_method = ?';
      params.push(filters.ingestMethod);
    }

    if (filters?.dateFrom) {
      query += ' AND date >= ?';
      params.push(filters.dateFrom);
    }

    if (filters?.dateTo) {
      query += ' AND date <= ?';
      params.push(filters.dateTo);
    }

    query += ' ORDER BY date DESC';

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as LegalUpdateRow[];
  }

  insertAttachment(attachment: Omit<AttachmentRow, 'id' | 'created_at'>) {
    const stmt = this.db.prepare(`
      INSERT INTO attachments (legal_update_id, filename, content, mime_type)
      VALUES (?, ?, ?, ?)
    `);

    return stmt.run(
      attachment.legal_update_id,
      attachment.filename,
      attachment.content,
      attachment.mime_type
    );
  }

  getAttachmentsByLegalUpdateId(legalUpdateId: string): AttachmentRow[] {
    const stmt = this.db.prepare('SELECT * FROM attachments WHERE legal_update_id = ?');
    return stmt.all(legalUpdateId) as AttachmentRow[];
  }
}
