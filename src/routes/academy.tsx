import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/academy")({
  component: AcademyLayout,
});

function AcademyLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLesson = pathname.replace(/\/$/, "") !== "/academy";

  return (
    <>
      {isLesson && (
        <div
          style={{
            position: "sticky",
            top: 62,
            zIndex: 40,
            backdropFilter: "blur(10px)",
            background: "rgba(10,14,26,0.75)",
            borderBottom: "1px solid #1f2740",
          }}
        >
          <div
            style={{
              maxWidth: 860,
              margin: "0 auto",
              padding: "10px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <Link
              to="/academy"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 12px",
                borderRadius: 9,
                border: "1px solid #1f2740",
                background: "#0f1422",
                color: "#00D4AA",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              ← Back to Academy Index
            </Link>
            <span style={{ color: "#6b7794", fontSize: 12 }}>Network Engineer Academy</span>
          </div>
        </div>
      )}
      <Outlet />
    </>
  );
}