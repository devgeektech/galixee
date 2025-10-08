import { NextResponse } from "next/server";
import sql from "@/db";

async function ensureSchema() {
  // Create required tables if they do not exist
  await sql`
    CREATE TABLE IF NOT EXISTS digital_vault_documents (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      file_url TEXT NOT NULL,
      file_type TEXT,
      file_size BIGINT,
      access_password TEXT NOT NULL,
      original_name TEXT DEFAULT '',
      document_type TEXT DEFAULT '',
      file_kind TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS digital_vault_trusted_agents (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      agent_name TEXT NOT NULL,
      agent_email TEXT NOT NULL,
      relationship TEXT DEFAULT '',
      access_password TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

async function handler({
  action,
  docId,
  password,
  document,
  agentData,
  method,
  agentId,
}) {
  // Derive session via DB (latest active session) since getSession() is unavailable here
  let session = null;
  try {
    const rows = await sql`
      SELECT s."userId", u.email, u.name
      FROM auth_sessions s
      JOIN auth_users u ON u.id = s."userId"
      WHERE s.expires > NOW()
      ORDER BY s.expires DESC
      LIMIT 1
    `;
    if (rows.length > 0) {
      const r = rows[0];
      session = { user: { id: r.userId, email: r.email, name: r.name } };
    }
  } catch {}

  if (!session?.user?.id) {
    console.error("Digital vault: No valid session");
    return  NextResponse.json({ error: "Unauthorized" });
  }

  const userId = session.user.id;
  console.log(`Digital vault action: ${action || method} for user ${userId}`);

  try {
    if (action === "listDocuments") {
      let documents;
      try {
        documents = await sql`
          SELECT id, title, description, file_type, file_size, original_name, 
                 document_type, file_kind, created_at, updated_at
          FROM digital_vault_documents 
          WHERE user_id = ${userId}
          ORDER BY created_at DESC
        `;
      } catch (e) {
        if (e?.code === '42P01') { // table does not exist
          await ensureSchema();
          documents = await sql`
            SELECT id, title, description, file_type, file_size, original_name, 
                   document_type, file_kind, created_at, updated_at
            FROM digital_vault_documents 
            WHERE user_id = ${userId}
            ORDER BY created_at DESC
          `;
        } else {
          throw e;
        }
      }
      console.log(`Found ${documents.length} documents for user ${userId}`);
      
      return  NextResponse.json({ documents });
    }

    if (action === "uploadDocument") {
      if (!document?.title || !document?.file_url || !password) {
        console.error("Upload document: Missing required fields", {
          document: !!document,
          password: !!password,
        });
        return  NextResponse.json({ error: "Missing required fields" });
      }

      // Hash the password using crypto instead of bcrypt
      const crypto = require("crypto");
      const salt = crypto.randomBytes(16).toString("hex");
      const hashedPassword =
        crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex") +
        ":" +
        salt;

      let newDocRows;
      try {
        newDocRows = await sql`
          INSERT INTO digital_vault_documents 
          (user_id, title, description, file_url, file_type, file_size, 
           access_password, original_name, document_type, file_kind)
          VALUES (${userId}, ${document.title}, ${document.description || ""}, 
                  ${document.file_url}, ${document.file_type}, ${document.file_size},
                  ${hashedPassword}, ${document.original_name || ""}, 
                  ${document.document_type || ""}, ${document.file_kind || ""})
          RETURNING *
        `;
      } catch (e) {
        if (e?.code === '42P01') {
          await ensureSchema();
          newDocRows = await sql`
            INSERT INTO digital_vault_documents 
            (user_id, title, description, file_url, file_type, file_size, 
             access_password, original_name, document_type, file_kind)
            VALUES (${userId}, ${document.title}, ${document.description || ""}, 
                    ${document.file_url}, ${document.file_type}, ${document.file_size},
                    ${hashedPassword}, ${document.original_name || ""}, 
                    ${document.document_type || ""}, ${document.file_kind || ""})
            RETURNING *
          `;
        } else {
          throw e;
        }
      }
      const [newDoc] = newDocRows;

      console.log(
        `Document uploaded successfully for user ${userId}:`,
        newDoc.id
      );
      return  NextResponse.json({ document: newDoc });
    }

    if (action === "accessDocument") {
      if (!docId || !password) {
        console.error("Access document: Missing params", {
          docId: !!docId,
          password: !!password,
        });
        return  NextResponse.json({ error: "Missing document ID or password" });
      }

      let docRows;
      try {
        docRows = await sql`
          SELECT * FROM digital_vault_documents 
          WHERE id = ${docId} AND user_id = ${userId}
        `;
      } catch (e) {
        if (e?.code === '42P01') {
          await ensureSchema();
          docRows = await sql`
            SELECT * FROM digital_vault_documents 
            WHERE id = ${docId} AND user_id = ${userId}
          `;
        } else {
          throw e;
        }
      }
      const [doc] = docRows;

      if (!doc) {
        console.error(`Document not found: ${docId} for user ${userId}`);
        return  NextResponse.json({ error: "Document not found" });
      }

      console.log(`Attempting to access document ${docId}`);
      console.log(
        `Password hash format: ${
          doc.access_password.includes(":") ? "crypto" : "bcrypt"
        }`
      );
      console.log(`Hash length: ${doc.access_password.length}`);

      // Check if this is an old bcrypt hash or new crypto hash
      let isValidPassword = false;

      if (doc.access_password.includes(":")) {
        // New crypto hash format
        console.log("Using crypto verification for new hash format");
        try {
          const crypto = require("crypto");
          const [hash, salt] = doc.access_password.split(":");
          console.log(`Salt length: ${salt ? salt.length : "undefined"}`);
          console.log(`Hash length: ${hash ? hash.length : "undefined"}`);

          const verifyHash = crypto
            .pbkdf2Sync(password, salt, 1000, 64, "sha512")
            .toString("hex");
          isValidPassword = hash === verifyHash;
          console.log(`Crypto verification result: ${isValidPassword}`);
        } catch (cryptoError) {
          console.error("Crypto verification error:", cryptoError);
          isValidPassword = false;
        }
      } else {
        // Legacy path without colon: treat as invalid or attempt crypto fallback split
        const parts = doc.access_password.split(":");
        if (parts.length === 2) {
          try {
            const crypto = require("crypto");
            const [hash, salt] = parts;
            const verifyHash = crypto
              .pbkdf2Sync(password, salt, 1000, 64, "sha512")
              .toString("hex");
            isValidPassword = hash === verifyHash;
          } catch (e) {
            isValidPassword = false;
          }
        } else {
          isValidPassword = false;
        }
      }

      if (!isValidPassword) {
        console.error(`Password verification failed for document ${docId}`);
        return  NextResponse.json({ error: "Invalid password" });
      }

      console.log(`Document accessed successfully: ${docId}`);
      return  NextResponse.json({ fileUrl: doc.file_url });
    }

    if (action === "deleteDocument") {
      if (!docId) {
        console.error("Delete document: Missing docId");
        return  NextResponse.json({ error: "Missing document ID" });
      }

      // First verify the document exists and get the password hash
      let docRowsPw;
      try {
        docRowsPw = await sql`
          SELECT access_password FROM digital_vault_documents 
          WHERE id = ${docId} AND user_id = ${userId}
        `;
      } catch (e) {
        if (e?.code === '42P01') {
          await ensureSchema();
          docRowsPw = await sql`
            SELECT access_password FROM digital_vault_documents 
            WHERE id = ${docId} AND user_id = ${userId}
          `;
        } else {
          throw e;
        }
      }
      const [doc] = docRowsPw;

      if (!doc) {
        console.error(
          `Delete: Document not found: ${docId} for user ${userId}`
        );
        return  NextResponse.json({ error: "Document not found" });
      }

      // Verify password if provided
      if (password) {
        let isValidPassword = false;

        if (doc.access_password.includes(":")) {
          // New crypto hash format
          try {
            const crypto = require("crypto");
            const [hash, salt] = doc.access_password.split(":");
            const verifyHash = crypto
              .pbkdf2Sync(password, salt, 1000, 64, "sha512")
              .toString("hex");
            isValidPassword = hash === verifyHash;
          } catch (cryptoError) {
            console.error("Crypto verification error:", cryptoError);
            isValidPassword = false;
          }
        } else {
          // Legacy path without colon: cannot verify without salt; mark invalid
          isValidPassword = false;
        }

        if (!isValidPassword) {
          console.error(`Delete: Invalid password for document ${docId}`);
          return  NextResponse.json({ error: "Invalid password" });
        }
      } else {
        console.error("Delete document: No password provided");
        return  NextResponse.json({ error: "Password required for deletion" });
      }

      // Delete the document
      const result = await sql`
        DELETE FROM digital_vault_documents 
        WHERE id = ${docId} AND user_id = ${userId}
      `;

      console.log(
        `Document deleted successfully: ${docId}, affected rows: ${result.length}`
      );
      return  NextResponse.json({ success: true });
    }

    if (action === "listTrustedAgents") {
      let agents;
      try {
        agents = await sql`
          SELECT id, agent_name, agent_email, relationship, created_at, updated_at
          FROM digital_vault_trusted_agents 
          WHERE user_id = ${userId}
          ORDER BY created_at DESC
        `;
      } catch (e) {
        if (e?.code === '42P01') {
          await ensureSchema();
          agents = await sql`
            SELECT id, agent_name, agent_email, relationship, created_at, updated_at
            FROM digital_vault_trusted_agents 
            WHERE user_id = ${userId}
            ORDER BY created_at DESC
          `;
        } else {
          throw e;
        }
      }
      console.log(`Found ${agents.length} trusted agents for user ${userId}`);
      return  NextResponse.json({ agents });
    }

    if (action === "addTrustedAgent") {
      if (!agentData?.name || !agentData?.email || !password) {
        console.error("Add agent: Missing required fields");
        return  NextResponse.json({ error: "Missing required agent data or password" });
      }

      // Hash the password using crypto
      const crypto = require("crypto");
      const salt = crypto.randomBytes(16).toString("hex");
      const hashedPassword =
        crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex") +
        ":" +
        salt;

      let newAgentRows;
      try {
        newAgentRows = await sql`
          INSERT INTO digital_vault_trusted_agents 
          (user_id, agent_name, agent_email, relationship, access_password)
          VALUES (${userId}, ${agentData.name}, ${agentData.email}, 
                  ${agentData.relationship || ""}, ${hashedPassword})
          RETURNING *
        `;
      } catch (e) {
        if (e?.code === '42P01') {
          await ensureSchema();
          newAgentRows = await sql`
            INSERT INTO digital_vault_trusted_agents 
            (user_id, agent_name, agent_email, relationship, access_password)
            VALUES (${userId}, ${agentData.name}, ${agentData.email}, 
                    ${agentData.relationship || ""}, ${hashedPassword})
            RETURNING *
          `;
        } else {
          throw e;
        }
      }
      const [newAgent] = newAgentRows;

      console.log(
        `Trusted agent added successfully for user ${userId}:`,
        newAgent.id
      );
      return  NextResponse.json({ agent: newAgent });
    }

    if (method === "DELETE_AGENT") {
      if (!agentId) {
        console.error("Delete agent: Missing agentId");
        return  NextResponse.json({ error: "Missing agent ID" });
      }

      let result;
      try {
        result = await sql`
          DELETE FROM digital_vault_trusted_agents 
          WHERE id = ${agentId} AND user_id = ${userId}
        `;
      } catch (e) {
        if (e?.code === '42P01') {
          await ensureSchema();
          result = await sql`
            DELETE FROM digital_vault_trusted_agents 
            WHERE id = ${agentId} AND user_id = ${userId}
          `;
        } else {
          throw e;
        }
      }

      console.log(
        `Trusted agent deleted successfully: ${agentId}, affected rows: ${result.length}`
      );
      return  NextResponse.json({ success: true });
    }

    console.error(`Invalid action or method: ${action || method}`);
    return  NextResponse.json({ error: "Invalid action" });
  } catch (error) {
    console.error("Digital vault handler error:", error);
    return  NextResponse.json({ error: "Server error: " + error.message });
  }
}
export async function POST(request) {
  return handler(await request.json());
}