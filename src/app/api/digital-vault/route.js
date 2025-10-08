async function handler({
  action,
  docId,
  password,
  document,
  agentData,
  method,
  agentId,
}) {
  const session = getSession();
  if (!session?.user?.id) {
    console.error("Digital vault: No valid session");
    return { error: "Unauthorized" };
  }

  const userId = session.user.id;
  console.log(`Digital vault action: ${action || method} for user ${userId}`);

  try {
    if (action === "listDocuments") {
      const documents = await sql`
        SELECT id, title, description, file_type, file_size, original_name, 
               document_type, file_kind, created_at, updated_at
        FROM digital_vault_documents 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `;
      console.log(`Found ${documents.length} documents for user ${userId}`);
      return { documents };
    }

    if (action === "uploadDocument") {
      if (!document?.title || !document?.file_url || !password) {
        console.error("Upload document: Missing required fields", {
          document: !!document,
          password: !!password,
        });
        return { error: "Missing required fields" };
      }

      // Hash the password using crypto instead of bcrypt
      const crypto = require("crypto");
      const salt = crypto.randomBytes(16).toString("hex");
      const hashedPassword =
        crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex") +
        ":" +
        salt;

      const [newDoc] = await sql`
        INSERT INTO digital_vault_documents 
        (user_id, title, description, file_url, file_type, file_size, 
         access_password, original_name, document_type, file_kind)
        VALUES (${userId}, ${document.title}, ${document.description || ""}, 
                ${document.file_url}, ${document.file_type}, ${
        document.file_size
      },
                ${hashedPassword}, ${document.original_name || ""}, 
                ${document.document_type || ""}, ${document.file_kind || ""})
        RETURNING *
      `;

      console.log(
        `Document uploaded successfully for user ${userId}:`,
        newDoc.id
      );
      return { document: newDoc };
    }

    if (action === "accessDocument") {
      if (!docId || !password) {
        console.error("Access document: Missing params", {
          docId: !!docId,
          password: !!password,
        });
        return { error: "Missing document ID or password" };
      }

      const [doc] = await sql`
        SELECT * FROM digital_vault_documents 
        WHERE id = ${docId} AND user_id = ${userId}
      `;

      if (!doc) {
        console.error(`Document not found: ${docId} for user ${userId}`);
        return { error: "Document not found" };
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
        // Old bcrypt hash format - try bcrypt first
        console.log("Using bcrypt verification for legacy hash format");
        try {
          const bcrypt = require("bcrypt");
          isValidPassword = await bcrypt.compare(password, doc.access_password);
          console.log(`Bcrypt verification result: ${isValidPassword}`);
        } catch (bcryptError) {
          console.error("Bcrypt verification error:", bcryptError);
          // If bcrypt fails, maybe it's actually a crypto hash without colon?
          // This shouldn't happen but let's be extra safe
          console.log("Bcrypt failed, trying crypto verification as fallback");
          try {
            const crypto = require("crypto");
            // Try to split anyway in case the colon check failed
            const parts = doc.access_password.split(":");
            if (parts.length === 2) {
              const [hash, salt] = parts;
              const verifyHash = crypto
                .pbkdf2Sync(password, salt, 1000, 64, "sha512")
                .toString("hex");
              isValidPassword = hash === verifyHash;
              console.log(
                `Crypto fallback verification result: ${isValidPassword}`
              );
            }
          } catch (cryptoFallbackError) {
            console.error(
              "Crypto fallback verification error:",
              cryptoFallbackError
            );
            isValidPassword = false;
          }
        }
      }

      if (!isValidPassword) {
        console.error(`Password verification failed for document ${docId}`);
        return { error: "Invalid password" };
      }

      console.log(`Document accessed successfully: ${docId}`);
      return { fileUrl: doc.file_url };
    }

    if (action === "deleteDocument") {
      if (!docId) {
        console.error("Delete document: Missing docId");
        return { error: "Missing document ID" };
      }

      // First verify the document exists and get the password hash
      const [doc] = await sql`
        SELECT access_password FROM digital_vault_documents 
        WHERE id = ${docId} AND user_id = ${userId}
      `;

      if (!doc) {
        console.error(
          `Delete: Document not found: ${docId} for user ${userId}`
        );
        return { error: "Document not found" };
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
          // Old bcrypt hash format
          try {
            const bcrypt = require("bcrypt");
            isValidPassword = await bcrypt.compare(
              password,
              doc.access_password
            );
          } catch (bcryptError) {
            console.error("Bcrypt verification error:", bcryptError);
            isValidPassword = false;
          }
        }

        if (!isValidPassword) {
          console.error(`Delete: Invalid password for document ${docId}`);
          return { error: "Invalid password" };
        }
      } else {
        console.error("Delete document: No password provided");
        return { error: "Password required for deletion" };
      }

      // Delete the document
      const result = await sql`
        DELETE FROM digital_vault_documents 
        WHERE id = ${docId} AND user_id = ${userId}
      `;

      console.log(
        `Document deleted successfully: ${docId}, affected rows: ${result.length}`
      );
      return { success: true };
    }

    if (action === "listTrustedAgents") {
      const agents = await sql`
        SELECT id, agent_name, agent_email, relationship, created_at, updated_at
        FROM digital_vault_trusted_agents 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `;
      console.log(`Found ${agents.length} trusted agents for user ${userId}`);
      return { agents };
    }

    if (action === "addTrustedAgent") {
      if (!agentData?.name || !agentData?.email || !password) {
        console.error("Add agent: Missing required fields");
        return { error: "Missing required agent data or password" };
      }

      // Hash the password using crypto
      const crypto = require("crypto");
      const salt = crypto.randomBytes(16).toString("hex");
      const hashedPassword =
        crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex") +
        ":" +
        salt;

      const [newAgent] = await sql`
        INSERT INTO digital_vault_trusted_agents 
        (user_id, agent_name, agent_email, relationship, access_password)
        VALUES (${userId}, ${agentData.name}, ${agentData.email}, 
                ${agentData.relationship || ""}, ${hashedPassword})
        RETURNING *
      `;

      console.log(
        `Trusted agent added successfully for user ${userId}:`,
        newAgent.id
      );
      return { agent: newAgent };
    }

    if (method === "DELETE_AGENT") {
      if (!agentId) {
        console.error("Delete agent: Missing agentId");
        return { error: "Missing agent ID" };
      }

      const result = await sql`
        DELETE FROM digital_vault_trusted_agents 
        WHERE id = ${agentId} AND user_id = ${userId}
      `;

      console.log(
        `Trusted agent deleted successfully: ${agentId}, affected rows: ${result.length}`
      );
      return { success: true };
    }

    console.error(`Invalid action or method: ${action || method}`);
    return { error: "Invalid action" };
  } catch (error) {
    console.error("Digital vault handler error:", error);
    return { error: "Server error: " + error.message };
  }
}
export async function POST(request) {
  return handler(await request.json());
}