/**
 * Comprehensive API tests against a running stem-Be (default http://127.0.0.1:5000).
 * Requires: node18+ (fetch). Loads ../.env for ADMIN_* optional JWT checks.
 *
 *   npm run test:smoke
 *   API_BASE=http://127.0.0.1:5000 npm run test:smoke
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const BASE = (process.env.API_BASE || "http://127.0.0.1:5000").replace(/\/$/, "");

let failed = 0;
function ok(name, cond, detail = "") {
  if (cond) console.log(`  OK ${name}${detail ? ` ${detail}` : ""}`);
  else {
    console.error(`  FAIL ${name}${detail ? ` ${detail}` : ""}`);
    failed++;
  }
}

async function req(path, opts = {}) {
  const url = `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { _raw: text.slice(0, 200) };
  }
  return { res, json, text };
}

async function main() {
  console.log(`\n=== Integration / API tests — ${BASE} ===\n`);

  // --- Health & 404 shape ---
  {
    const { res, json } = await req("/api/health");
    ok("GET /api/health", res.status === 200 && json?.status === "ok", `(${res.status})`);
  }

  {
    const { res, json } = await req("/api/does-not-exist-xyz");
    ok(
      "GET unknown /api/* returns JSON 404",
      res.status === 404 && (json?.error === "Not Found" || json?.path),
      `(${res.status})`
    );
  }

  // --- Public read ---
  let courseSlug = null;
  let courseCount = 0;
  {
    const { res, json } = await req("/api/courses");
    ok(
      "GET /api/courses",
      res.status === 200 && Array.isArray(json),
      `(${res.status}, ${Array.isArray(json) ? json.length : 0} active courses)`
    );
    if (Array.isArray(json) && json.length > 0) {
      courseCount = json.length;
      courseSlug = json[0].slug;
    }
  }

  if (courseSlug) {
    const { res, json } = await req(`/api/courses/${courseSlug}`);
    ok(
      `GET /api/courses/${courseSlug}`,
      res.status === 200 && json?.slug === courseSlug,
      `(${res.status})`
    );
  } else {
    console.log("  SKIP GET /api/courses/:slug (no active courses — run npm run seed)");
  }

  {
    const { res } = await req("/api/courses/this-slug-should-not-exist-99999");
    ok("GET /api/courses invalid slug → 404", res.status === 404, `(${res.status})`);
  }

  {
    const { res, json } = await req("/api/team");
    ok(
      "GET /api/team",
      res.status === 200 && Array.isArray(json),
      `(${res.status}, ${Array.isArray(json) ? json.length : 0} members)`
    );
  }

  {
    const { res, json } = await req("/api/challenges/public/latest");
    ok(
      "GET /api/challenges/public/latest",
      res.status === 200 || res.status === 404,
      res.status === 404 ? "(404 no published — OK)" : `(${res.status})`
    );
  }

  // --- Recommend ---
  {
    const { res, json } = await req("/api/recommend", {
      method: "POST",
      body: JSON.stringify({
        message: "My son is 10 and wants to learn Scratch",
        locale: "en",
      }),
    });
    const recOk =
      (res.status === 200 &&
        Array.isArray(json?.ids) &&
        json.ids.length > 0) ||
      (res.status === 500 &&
        /no courses/i.test(String(json?.message || json?.error || "")));
    ok(
      "POST /api/recommend (valid body)",
      recOk,
      `(${res.status}${courseCount ? "" : ", empty DB — seed for200"})`
    );
  }

  {
    const { res } = await req("/api/recommend", {
      method: "POST",
      body: JSON.stringify({ message: "", locale: "en" }),
    });
    ok("POST /api/recommend empty message → 400", res.status === 400, `(${res.status})`);
  }

  {
    const { res } = await req("/api/recommend", {
      method: "POST",
      body: JSON.stringify({ locale: "en" }),
    });
    ok("POST /api/recommend missing message → 400", res.status === 400, `(${res.status})`);
  }

  // --- Auth validation ---
  {
    const { res } = await req("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "not-an-email", password: "x" }),
    });
    ok("POST /api/auth/login invalid email → 400", res.status === 400, `(${res.status})`);
  }

  {
    const { res } = await req("/api/auth/me");
    ok("GET /api/auth/me without token → 401", res.status === 401, `(${res.status})`);
  }

  {
    const { res } = await req("/api/auth/admin-login", {
      method: "POST",
      body: JSON.stringify({
        email: "wrong-admin@invalid.test",
        username: "wronguser",
        password: "wrongpass",
      }),
    });
    ok("POST /api/auth/admin-login invalid creds → 400", res.status === 400, `(${res.status})`);
  }

  // --- Contact & enrollment validation ---
  {
    const { res } = await req("/api/contact", {
      method: "POST",
      body: JSON.stringify({}),
    });
    ok("POST /api/contact empty body → 400", res.status === 400, `(${res.status})`);
  }

  {
    const { res } = await req("/api/contact/507f191e810c19729de860ea", {
      method: "PATCH",
      body: JSON.stringify({ status: "read" }),
    });
    ok("PATCH /api/contact/:id without token → 401", res.status === 401, `(${res.status})`);
  }

  {
    const { res } = await req("/api/enrollments", {
      method: "POST",
      body: JSON.stringify({}),
    });
    ok("POST /api/enrollments empty body → 400", res.status === 400, `(${res.status})`);
  }

  {
    const { res } = await req("/api/enrollments");
    ok("GET /api/enrollments without token → 401", res.status === 401, `(${res.status})`);
  }

  // --- Admin routes without token ---
  {
    const { res } = await req("/api/admin/overview");
    ok("GET /api/admin/overview without token → 401", res.status === 401, `(${res.status})`);
  }

  {
    const { res } = await req("/api/courses/admin/list");
    ok("GET /api/courses/admin/list without token → 401", res.status === 401, `(${res.status})`);
  }

  {
    const { res } = await req("/api/challenges");
    ok("GET /api/challenges without token → 401", res.status === 401, `(${res.status})`);
  }

  // --- Admin JWT (optional) ---
  const ae = process.env.SMOKE_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
  const au = process.env.SMOKE_ADMIN_USERNAME || process.env.ADMIN_USERNAME;
  const ap = process.env.SMOKE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  let adminToken = null;

  if (ae && au && ap) {
    const { res, json } = await req("/api/auth/admin-login", {
      method: "POST",
      body: JSON.stringify({ email: ae, username: au, password: ap }),
    });
    ok("POST /api/auth/admin-login valid", res.status === 200 && json?.token, `(${res.status})`);
    adminToken = json?.token || null;

    if (adminToken) {
      const { res: r1, json: u } = await req("/api/auth/me", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      ok("GET /api/auth/me with token", r1.status === 200 && u?.role === "admin", `(${r1.status})`);

      const { res: r2, json: j2 } = await req("/api/admin/overview", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      ok("GET /api/admin/overview", r2.status === 200 && j2?.users, `(${r2.status})`);

      const { res: r3, json: list } = await req("/api/courses/admin/list", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      ok("GET /api/courses/admin/list", r3.status === 200 && Array.isArray(list), `(${r3.status})`);

      if (Array.isArray(list) && list[0]?.slug) {
        const s = list[0].slug;
        const { res: r3b } = await req(`/api/courses/admin/by-slug/${s}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        ok(`GET /api/courses/admin/by-slug/${s}`, r3b.status === 200, `(${r3b.status})`);
      }

      const { res: r4 } = await req("/api/enrollments", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      ok("GET /api/enrollments (admin)", r4.status === 200, `(${r4.status})`);

      const { res: r5 } = await req("/api/contact", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      ok("GET /api/contact (admin)", r5.status === 200, `(${r5.status})`);

      {
        const created = await req("/api/contact", {
          method: "POST",
          body: JSON.stringify({
            name: "Smoke Contact",
            email: "smoke-patch-contact@invalid.test",
            subject: "Smoke PATCH",
            message: "integration-smoke",
          }),
        });
        const newId =
          created.res.status === 201 && created.json?.id
            ? String(created.json.id)
            : null;
        if (newId) {
          const { res: pc, json: pj } = await req(`/api/contact/${newId}`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({ status: "read" }),
          });
          ok(
            "PATCH /api/contact/:id (admin)",
            pc.status === 200 && pj?.status === "read",
            `(${pc.status})`
          );
        } else {
          console.log(
            "  SKIP PATCH /api/contact/:id (admin) — POST contact did not return id"
          );
        }
      }

      const { res: r6 } = await req("/api/challenges", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      ok("GET /api/challenges (admin)", r6.status === 200, `(${r6.status})`);

      const { res: r7 } = await req("/api/team/admin/list", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      ok("GET /api/team/admin/list", r7.status === 200, `(${r7.status})`);
    }
  } else {
    console.log(
      "  SKIP admin JWT deep checks (set ADMIN_EMAIL, ADMIN_USERNAME, ADMIN_PASSWORD in .env)"
    );
  }

  console.log("");
  if (failed) {
    console.error(`Failed: ${failed} check(s)\n`);
    process.exit(1);
  }
  console.log(`All ${BASE} API checks passed.\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
