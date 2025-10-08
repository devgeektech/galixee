async function handler({ method, body }) {
  const session = getSession();

  if (!session?.user?.id) {
    return { error: "Authentication required", status: 401 };
  }

  const userId = session.user.id;

  try {
    if (method === "GET") {
      const { category, favorites } = body || {};

      let query = "SELECT * FROM user_quotes WHERE user_id = $1";
      let params = [userId];
      let paramCount = 1;

      if (category) {
        paramCount++;
        query += ` AND category = $${paramCount}`;
        params.push(category);
      }

      if (favorites === true || favorites === "true") {
        query += " AND is_favorite = true";
      }

      query += " ORDER BY created_at DESC";

      const quotes = await sql(query, params);
      return { quotes };
    }

    if (method === "POST") {
      const {
        quote_text,
        author,
        category = "personal",
        is_favorite = false,
      } = body;

      if (!quote_text) {
        return { error: "Quote text is required", status: 400 };
      }

      const result = await sql(
        "INSERT INTO user_quotes (user_id, quote_text, author, category, is_favorite) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [userId, quote_text, author, category, is_favorite]
      );

      return { quote: result[0], message: "Quote created successfully" };
    }

    if (method === "PUT") {
      const { id, quote_text, author, category, is_favorite } = body;

      if (!id) {
        return { error: "Quote ID is required", status: 400 };
      }

      const existing = await sql(
        "SELECT * FROM user_quotes WHERE id = $1 AND user_id = $2",
        [id, userId]
      );

      if (existing.length === 0) {
        return { error: "Quote not found", status: 404 };
      }

      let setClauses = [];
      let values = [];
      let paramCount = 0;

      if (quote_text !== undefined) {
        paramCount++;
        setClauses.push(`quote_text = $${paramCount}`);
        values.push(quote_text);
      }

      if (author !== undefined) {
        paramCount++;
        setClauses.push(`author = $${paramCount}`);
        values.push(author);
      }

      if (category !== undefined) {
        paramCount++;
        setClauses.push(`category = $${paramCount}`);
        values.push(category);
      }

      if (is_favorite !== undefined) {
        paramCount++;
        setClauses.push(`is_favorite = $${paramCount}`);
        values.push(is_favorite);
      }

      if (setClauses.length === 0) {
        return { error: "No fields to update", status: 400 };
      }

      paramCount++;
      setClauses.push(`updated_at = $${paramCount}`);
      values.push(new Date());

      const query = `UPDATE user_quotes SET ${setClauses.join(
        ", "
      )} WHERE id = $${paramCount + 1} AND user_id = $${
        paramCount + 2
      } RETURNING *`;
      values.push(id, userId);

      const result = await sql(query, values);
      return { quote: result[0], message: "Quote updated successfully" };
    }

    if (method === "DELETE") {
      const { id } = body;

      if (!id) {
        return { error: "Quote ID is required", status: 400 };
      }

      const existing = await sql(
        "SELECT * FROM user_quotes WHERE id = $1 AND user_id = $2",
        [id, userId]
      );

      if (existing.length === 0) {
        return { error: "Quote not found", status: 404 };
      }

      await sql("DELETE FROM user_quotes WHERE id = $1 AND user_id = $2", [
        id,
        userId,
      ]);
      return { message: "Quote deleted successfully" };
    }

    return { error: "Method not allowed", status: 405 };
  } catch (error) {
    console.error("Quotes handler error:", error);
    return { error: "Internal server error", status: 500 };
  }
}
export async function POST(request) {
  return handler(await request.json());
}